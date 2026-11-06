'use client';

import React, { useState } from 'react';
import { Phone, CheckCircle, ChevronDown, Check, ShieldCheck, Mail, MessageSquare } from 'lucide-react';
import type { Property } from '@/data/properties';

interface DealerEnquirySectionProps {
  property: Property;
}

export default function DealerEnquirySection({ property }: DealerEnquirySectionProps) {
  // State for dealer details
  const [showPhone, setShowPhone] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  // Form state
  const [userType, setUserType] = useState<'Individual' | 'Dealer'>('Individual');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('IND (+91)');
  const [message, setMessage] = useState('I am interested in this Property.');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const dealerName = property.builderName || 'AKSHABI HOMES';
  const dealerPhone = property.phoneNumber || '+91 98401 23456';
  const dealerAddress = property.address || (property.locality && property.city ? `${property.locality}, ${property.city}` : 'Aruppukkottai, Tamil Nadu');
  const maxChars = 400;

  const handlePhoneClick = () => {
    if (!showPhone) {
      setShowPhone(true);
    } else {
      navigator.clipboard?.writeText(dealerPhone.replace(/\s+/g, ''));
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your phone number');
      return;
    }
    if (!agreedTerms) {
      setErrorMsg('Please accept the Terms & Conditions');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setName('');
        setPhone('');
        setMessage('I am interested in this Property.');
      }, 4000);
    }, 700);
  };

  return (
    <section className="py-9 border-b border-slate-200" id="dealer">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Left Column: Dealer Details */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 tracking-tight">
                Dealer Details
              </h3>

              {/* Logo + Name & Action */}
              <div className="flex items-start gap-4 sm:gap-5">
                {/* Dealer Circular Crest Logo */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-[#7a1416] via-[#630f11] to-[#45090b] p-1.5 shadow-md flex items-center justify-center border-2 border-white ring-1 ring-slate-200">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Dark circle base */}
                      <circle cx="50" cy="50" r="46" fill="#6c1113" />
                      
                      {/* Stylized background building silhouette */}
                      <rect x="42" y="20" width="18" height="48" rx="2" fill="#ea580c" />
                      <rect x="45" y="24" width="4" height="4" fill="#fef08a" />
                      <rect x="53" y="24" width="4" height="4" fill="#fef08a" />
                      <rect x="45" y="32" width="4" height="4" fill="#fef08a" />
                      <rect x="53" y="32" width="4" height="4" fill="#fef08a" />
                      <rect x="45" y="40" width="4" height="4" fill="#fef08a" />
                      <rect x="53" y="40" width="4" height="4" fill="#fef08a" />
                      
                      {/* Angled building towers in warm orange/amber */}
                      <path d="M60 28L78 36V68H60V28Z" fill="#f59e0b" />
                      <rect x="64" y="40" width="4" height="4" fill="#ffffff" opacity="0.9" />
                      <rect x="71" y="44" width="4" height="4" fill="#ffffff" opacity="0.9" />
                      <rect x="64" y="48" width="4" height="4" fill="#ffffff" opacity="0.9" />
                      <rect x="71" y="52" width="4" height="4" fill="#ffffff" opacity="0.9" />

                      {/* Foreground blue roof / house structure */}
                      <path d="M22 42L36 34V68H22V42Z" fill="#1e3a8a" stroke="#ffffff" strokeWidth="2" />
                      <path d="M18 68L50 48L82 68L78 74L50 56L22 74L18 68Z" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
                      
                      {/* Small window accents */}
                      <rect x="45" y="60" width="10" height="10" rx="1" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs" title="Verified Dealer">
                    <ShieldCheck size={13} strokeWidth={2.5} />
                  </span>
                </div>

                {/* Name, Subtitle & Call CTA */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-extrabold text-[#087ed9] tracking-tight truncate">
                    {dealerName}
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {dealerName}
                  </p>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handlePhoneClick}
                      className="inline-flex items-center gap-2 bg-[#20c997] hover:bg-[#1bb587] text-white text-xs sm:text-[13px] font-bold px-4 py-2 rounded-lg transition duration-200 shadow-xs cursor-pointer active:scale-98"
                    >
                      <Phone size={14} className="fill-white" />
                      <span>{showPhone ? dealerPhone : 'View Phone Number'}</span>
                    </button>
                    {phoneCopied && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1 animate-in fade-in">
                        Copied to clipboard!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats & Meta Information */}
              <div className="mt-5 space-y-2.5 text-xs sm:text-[13px] text-slate-700">
                <p>
                  <span className="text-slate-600">Properties Listed: </span>
                  <span className="font-extrabold text-[#087ed9]">25</span>
                </p>

                <p className="leading-relaxed">
                  <span className="font-semibold text-slate-800">Localities : </span>
                  <span className="text-slate-600">
                    Melakottaiyur, Nellikuppam, Kandigai, Nallambakkam, Rathinamangalam, Vandalur Kelambakkam Road
                  </span>
                </p>

                <div className="pt-1">
                  <p className="font-bold text-slate-900">
                    About {dealerName}
                  </p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Promoters of residential projects
                  </p>
                </div>

                <p className="pt-0.5">
                  <span className="font-semibold text-slate-800">Address : </span>
                  <span className="text-slate-600">{dealerAddress}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Send enquiry to Dealer Form */}
          <div className="lg:col-span-7 lg:border-l lg:border-slate-200 lg:pl-10">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5 tracking-tight">
              Send enquiry to Dealer
            </h3>

            {submitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3.5 animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm sm:text-base">Enquiry Sent Successfully!</h4>
                  <p className="text-xs sm:text-sm text-emerald-700 mt-1 leading-relaxed">
                    Your interest in <strong>{property.name}</strong> has been shared with <strong>{dealerName}</strong>. 
                    You will receive confirmation and updates via Email & SMS shortly.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* "You are" Selector */}
                <div className="flex items-center gap-4 text-xs sm:text-sm">
                  <span className="text-slate-600 font-medium">You are</span>
                  
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="userType"
                      value="Individual"
                      checked={userType === 'Individual'}
                      onChange={() => setUserType('Individual')}
                      className="accent-[#087ed9] w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-xs sm:text-[13px] ${userType === 'Individual' ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                      Individual
                    </span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="userType"
                      value="Dealer"
                      checked={userType === 'Dealer'}
                      onChange={() => setUserType('Dealer')}
                      className="accent-[#087ed9] w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-xs sm:text-[13px] ${userType === 'Dealer' ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                      Dealer
                    </span>
                  </label>
                </div>

                {/* Form Fields: Two Column Grid (Inputs on Left, Textarea on Right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Left sub-column: Name and Phone */}
                  <div className="flex flex-col gap-3">
                    <div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#087ed9] transition"
                      />
                    </div>

                    {/* Country Code + Phone Number combo */}
                    <div className="flex rounded-lg border border-slate-200 focus-within:border-[#087ed9] transition overflow-hidden bg-white">
                      <div className="relative border-r border-slate-200 bg-slate-50 flex items-center">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="appearance-none bg-transparent pl-3 pr-7 py-2.5 text-xs text-slate-700 font-semibold outline-none cursor-pointer"
                        >
                          <option value="IND (+91)">IND (+91)</option>
                          <option value="USA (+1)">USA (+1)</option>
                          <option value="UAE (+971)">UAE (+971)</option>
                          <option value="UK (+44)">UK (+44)</option>
                          <option value="SGP (+65)">SGP (+65)</option>
                        </select>
                        <ChevronDown size={13} className="text-slate-400 absolute right-2 pointer-events-none" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="flex-1 bg-white px-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Right sub-column: Message Textarea with Char Counter */}
                  <div className="flex flex-col">
                    <div className="relative flex-1">
                      <textarea
                        value={message}
                        maxLength={maxChars}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        className="w-full h-full min-h-[92px] bg-white border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#087ed9] resize-none transition"
                      />
                    </div>
                    <div className="text-right text-[11px] text-slate-400 mt-1 font-medium">
                      {maxChars - message.length} chars
                    </div>
                  </div>
                </div>

                {/* Error Message if any */}
                {errorMsg && (
                  <p className="text-xs text-red-500 font-medium">
                    {errorMsg}
                  </p>
                )}

                {/* Checkbox: Terms & Conditions */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 accent-[#087ed9] rounded w-4 h-4 cursor-pointer shrink-0"
                    />
                    <span className="text-xs text-slate-500 leading-normal">
                      I agree to the{' '}
                      <span className="text-[#087ed9] hover:underline">Terms & Conditions</span>
                      {' '}and{' '}
                      <span className="text-[#087ed9] hover:underline">Privacy Policy</span>
                    </span>
                  </label>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#087ed9] hover:bg-[#076ec0] text-white font-bold text-xs sm:text-sm px-6 h-[53px] rounded-lg transition duration-200 shadow-xs cursor-pointer active:scale-98 disabled:opacity-60 inline-flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <span>Send Email & SMS</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
