#!/usr/bin/env node
'use strict';

/**
 * Ryderr MCP Server
 *
 * Exposes Ryderr marketplace data as MCP tools for AI agents.
 * Run standalone:  node backend/src/mcp/server.js
 * Or via npx:      npx @modelcontextprotocol/sdk run backend/src/mcp/server.js
 *
 * Tools:
 *   search_inventory      — find vehicle listings by filters
 *   get_listing           — get a single listing by ID
 *   get_dealer_leads      — get leads for a dealer
 *   get_lead              — get a single lead
 *   get_dealer_analytics  — get performance stats for a dealer
 *   get_network_stats     — get platform-wide marketplace stats (admin)
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const server = new McpServer({
  name:    'ryderr-marketplace',
  version: '1.0.0',
});

// ── Tool: search_inventory ────────────────────────────────────────────────────
server.tool(
  'search_inventory',
  'Search vehicle listings on the Ryderr marketplace. Returns matching listings with price, specs, location, and seller info.',
  {
    make:         z.string().optional().describe('Vehicle make, e.g. Toyota, Honda'),
    model:        z.string().optional().describe('Vehicle model, e.g. Fortuner, CR-V'),
    year_min:     z.number().optional().describe('Minimum year'),
    year_max:     z.number().optional().describe('Maximum year'),
    price_min:    z.number().optional().describe('Minimum price in PHP'),
    price_max:    z.number().optional().describe('Maximum price in PHP'),
    fuel_type:    z.string().optional().describe('Fuel type: gasoline, diesel, hybrid, electric'),
    transmission: z.string().optional().describe('Transmission: automatic, manual'),
    city:         z.string().optional().describe('City, e.g. Makati, Quezon City'),
    condition:    z.string().optional().describe('Condition: excellent, good, fair, poor'),
    limit:        z.number().optional().default(10).describe('Max results (default 10, max 50)'),
  },
  async ({ make, model, year_min, year_max, price_min, price_max, fuel_type, transmission, city, condition, limit }) => {
    const where = { status: 'active' };
    if (make)         where.make         = { contains: make, mode: 'insensitive' };
    if (model)        where.model        = { contains: model, mode: 'insensitive' };
    if (year_min || year_max) where.year = { gte: year_min, lte: year_max };
    if (price_min || price_max) where.price = { gte: price_min, lte: price_max };
    if (fuel_type)    where.fuelType     = fuel_type;
    if (transmission) where.transmission = transmission;
    if (city)         where.city         = { contains: city, mode: 'insensitive' };
    if (condition)    where.condition    = condition;

    const listings = await prisma.vehicleListing.findMany({
      where,
      take:    Math.min(limit || 10, 50),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, make: true, model: true, year: true, variant: true,
        price: true, mileage: true, fuelType: true, transmission: true,
        condition: true, city: true, sellerType: true, inventorySource: true,
        createdAt: true,
        dealer: { select: { businessName: true, isVerified: true } },
      },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ listings, count: listings.length }, null, 2),
      }],
    };
  }
);

// ── Tool: get_listing ─────────────────────────────────────────────────────────
server.tool(
  'get_listing',
  'Get full details of a specific vehicle listing by ID.',
  { id: z.string().describe('Listing ID') },
  async ({ id }) => {
    const listing = await prisma.vehicleListing.findUnique({
      where: { id },
      include: {
        dealer: { select: { businessName: true, city: true, isVerified: true } },
        seller: { select: { name: true } },
      },
    });

    if (!listing) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Listing not found' }) }] };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(listing, null, 2) }],
    };
  }
);

// ── Tool: get_dealer_leads ────────────────────────────────────────────────────
server.tool(
  'get_dealer_leads',
  'Get leads for a dealer. Requires dealer ID. Returns recent buyer inquiries.',
  {
    dealer_id: z.string().describe('Dealer ID'),
    status:    z.string().optional().describe('Filter by status: new, contacted, qualified, closed'),
    limit:     z.number().optional().default(20).describe('Max results'),
  },
  async ({ dealer_id, status, limit }) => {
    const where = { dealerId: dealer_id };
    if (status) where.status = status;

    const leads = await prisma.lead.findMany({
      where,
      take:    Math.min(limit || 20, 100),
      orderBy: { createdAt: 'desc' },
    });

    return {
      content: [{ type: 'text', text: JSON.stringify({ leads, count: leads.length }, null, 2) }],
    };
  }
);

// ── Tool: get_lead ────────────────────────────────────────────────────────────
server.tool(
  'get_lead',
  'Get full details of a specific lead by ID.',
  { id: z.string().describe('Lead ID') },
  async ({ id }) => {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!lead) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Lead not found' }) }] };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(lead, null, 2) }],
    };
  }
);

// ── Tool: get_dealer_analytics ────────────────────────────────────────────────
server.tool(
  'get_dealer_analytics',
  'Get performance analytics for a dealer: listing count, lead volume, response rate.',
  { dealer_id: z.string().describe('Dealer ID') },
  async ({ dealer_id }) => {
    const [listingCount, leadCount, recentLeads] = await Promise.all([
      prisma.vehicleListing.count({ where: { dealerId: dealer_id, status: 'active' } }),
      prisma.lead.count({ where: { dealerId: dealer_id } }),
      prisma.lead.count({
        where: { dealerId: dealer_id, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      }),
    ]);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          dealer_id,
          activeListings: listingCount,
          totalLeads:     leadCount,
          leadsLast30Days: recentLeads,
        }, null, 2),
      }],
    };
  }
);

// ── Tool: get_network_stats ───────────────────────────────────────────────────
server.tool(
  'get_network_stats',
  'Get platform-wide Ryderr marketplace statistics: total listings, dealers, leads.',
  {},
  async () => {
    const [listings, dealers, leads, leadsToday] = await Promise.all([
      prisma.vehicleListing.count({ where: { status: 'active' } }),
      prisma.dealer.count({ where: { user: { isActive: true } } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    ]);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ activeListings: listings, totalDealers: dealers, totalLeads: leads, leadsToday }, null, 2),
      }],
    };
  }
);

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Ryderr MCP server running on stdio');
}

main().catch(err => {
  console.error('MCP server error:', err);
  process.exit(1);
});
