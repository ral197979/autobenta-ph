import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    q: 'How long does the LTO transfer process take?',
    a: 'The complete transfer process typically takes 7–14 business days from document submission at the LTO. Metro Manila offices may take longer during peak periods. Prepare all documents in advance to avoid delays caused by incomplete requirements.',
  },
  {
    q: 'What if the OR/CR is missing or damaged?',
    a: 'If the OR/CR is lost, the seller must file an affidavit of loss and apply for a duplicate at the LTO. The process takes an additional 5–10 business days and incurs extra fees. Verify the OR/CR is present and matches the vehicle before agreeing to purchase.',
  },
  {
    q: 'What is an open Deed of Sale, and is it legal?',
    a: 'An open Deed of Sale has the buyer\'s name left blank. While common in the Philippines, it carries legal risks: you cannot prove ownership transfer until your name is filled in. Always insist on a fully completed, notarized Deed of Sale with your name, ID number, and the agreed purchase price.',
  },
  {
    q: 'Do I need an HPG clearance for all vehicles?',
    a: 'HPG clearance is required for vehicles with engine displacement of 400cc and above, vehicles used for hire (taxis, Grab, buses), and motorcycles above 400cc. For standard private passenger cars below 400cc, HPG clearance is generally not required. Confirm with your LTO district office.',
  },
  {
    q: 'Can I transfer a vehicle that still has an outstanding car loan?',
    a: 'A financed vehicle can only be transferred after the chattel mortgage is fully settled and a Release of Chattel Mortgage is obtained from the financing institution. Attempting to sell a vehicle with an active chattel mortgage without disclosure is illegal. Always request a bank clearance before completing the sale.',
  },
  {
    q: 'What fees should the seller vs. buyer pay?',
    a: 'By convention in the Philippines, the seller covers notarization and any penalties from previous ownership. The buyer typically pays LTO transfer fees, registration, emission testing, and insurance. This is negotiable — always document the arrangement in the Deed of Sale or a separate written agreement.',
  },
  {
    q: 'Is it safe to pay before receiving the OR/CR?',
    a: 'It is strongly advisable not to release full payment until you have physically received the original OR/CR and the signed Deed of Sale. Use a verified escrow or conditional payment arrangement. Never pay cash in full without receiving the original documents on the same day.',
  },
  {
    q: 'What is the difference between OR and CR?',
    a: 'The Official Receipt (OR) proves payment of registration fees and is renewed annually. The Certificate of Registration (CR) is the permanent ownership document that carries the vehicle\'s details and the registered owner\'s name. Both documents must be transferred to the new owner.',
  },
];

export default function TransferFAQ() {
  const [open, setOpen] = useState(null);

  return (
    <div className="space-y-2">
      {FAQS.map((item, idx) => {
        const isOpen = open === idx;
        return (
          <div
            key={idx}
            className={`rounded-xl border transition-colors ${
              isOpen ? 'border-primary/30 bg-blue-50/40' : 'border-border-subtle bg-surface-container-lowest'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : idx)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
            >
              <span className={`text-sm font-semibold leading-snug ${isOpen ? 'text-primary' : 'text-on-surface'}`}>
                {item.q}
              </span>
              <span className="mt-0.5 shrink-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-on-surface-variant" />
                )}
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5">
                <p className="text-sm text-on-surface-variant leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
