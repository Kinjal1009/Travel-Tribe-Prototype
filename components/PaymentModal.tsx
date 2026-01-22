
import React, { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  itemLabel: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm, amount, itemLabel }) => {
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onConfirm();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A3D91]/40 backdrop-blur-md">
      <div className="bg-white max-w-md w-full p-10 rounded-[3rem] shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-black mb-2 text-[#0F172A] uppercase tracking-tighter">Confirm Payment</h2>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">MOCK SECURE GATEWAY</p>
        
        <div className="bg-gray-50 p-6 rounded-3xl mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{itemLabel}</span>
            <span className="text-lg font-black text-[#0A3D91]">₹{amount.toLocaleString()}</span>
          </div>
          <div className="text-[9px] text-gray-400 text-left border-t border-gray-100 pt-3 italic">
            Note: This is a simulation. No real money will be deducted from your account.
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handlePay}
            disabled={processing}
            className="w-full bg-[#0A3D91] hover:bg-[#2563EB] text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {processing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                VERIFYING...
              </>
            ) : 'PAY NOW'}
          </button>
          <button 
            onClick={onClose}
            className="w-full text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-[#0A3D91] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
