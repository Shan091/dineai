import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Wallet,
  QrCode,
  CheckCircle2,
  Loader2,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Heart,
  Star,
  RefreshCw,
  Download,
  Utensils
} from 'lucide-react';
import { CartItem } from './SmartCart';
import { generatePDF } from '../utils/receipt';
import { api } from '../services/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
  onKeepOrdering: () => void;
  cartItems: CartItem[];
  guestName?: string;
  onPay?: () => Promise<void>;
  orderId?: string; // New Prop for robust fetch
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  onKeepOrdering,
  cartItems,
  guestName = "Guest",
  onPay,
  orderId
}) => {
  const [method, setMethod] = useState<'upi' | 'card' | 'cash' | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [rating, setRating] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); // For user feedback

  // Auto-Reset Countdown State
  const [countdown, setCountdown] = useState<number | null>(null);

  // --- ANIMATION SYNC ---
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setStatus('idle');
      setMethod(null);
      setRating(0);
      setCountdown(null);
    } else {
      setTimeout(() => setIsAnimating(false), 200);
    }
  }, [isOpen]);

  // --- AUTO-RESET TIMER ---
  useEffect(() => {
    if (status === 'success') {
      setCountdown(15); // Start 15s countdown
    }
  }, [status]);

  useEffect(() => {
    if (countdown === null || status !== 'success') return;

    if (countdown <= 0) {
      onPaymentComplete(); // Trigger auto-reset
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, status, onPaymentComplete]);

  const handleCancelTimer = () => {
    setCountdown(null);
  };

  const handleRating = (star: number) => {
    handleCancelTimer(); // Stop timer on interaction
    setRating(star);
  };

  const handleDownloadReceipt = async () => {
    // handleCancelTimer(); // Removed as per request to prevent ReferenceError (though definition is restored above)
    setIsDownloading(true);

    try {
      let itemsToPrint = cartItems;
      let totalToPrint = 0; // Will be calc inside or passed

      // 1. Try to fetch Absolute Truth from Server
      if (orderId) {
        try {
          const fullOrder = await api.getOrder(orderId);

          console.log("FULL HISTORY RECEIVED:", fullOrder?.items); // Debug Log

          if (fullOrder && fullOrder.items) {
            itemsToPrint = fullOrder.items.map((i: any, idx: number) => ({
              cartId: `server-${idx}`,
              menuId: 'uk',
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              category: 'Mains',
              notes: i.notes
            }));
            // Use backend total
            totalToPrint = fullOrder.totalAmount;
          }
        } catch (fetchErr) {
          console.warn("Could not fetch full history, using context state.", fetchErr);
        }
      }

      // 2. Generate
      // If we didn't get total from backend, we calculate. 
      // But generatePDF calculates internally based on items if we pass items.
      // Wait, generatePDF signature is (items, total, name...).
      // We should pass 0 or filtered total if we want it to verify?
      // Actually generatePDF recalculates subtotal from items.
      // So if itemsToPrint is correct, receipt is correct.

      const calcTotal = itemsToPrint.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      // Rough tax calc for display if needed, but generatePDF handles it.

      generatePDF(itemsToPrint, totalToPrint || calcTotal, guestName);

    } catch (e) {
      console.error("Receipt Gen Failed", e);
      alert("Could not generate receipt");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOrderMore = () => {
    handleCancelTimer();
    onKeepOrdering();
  };

  // --- CALCULATIONS ---
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const gst = Math.round(subtotal * 0.05);
  const serviceCharge = Math.round(subtotal * 0.025);
  const total = subtotal + gst + serviceCharge;

  // --- HANDLERS ---
  const handleConfirm = async () => {
    if (!method) return;
    setStatus('processing');

    try {
      // 1. Trigger Backend Settlement
      if (onPay) {
        await onPay();
      }

      // 2. Artificial Delay for UX (min 1.5s)
      setTimeout(() => {
        setStatus('success');
      }, 1500);

    } catch (error) {
      console.error("Payment Failed", error);
      setStatus('idle');
      alert("Payment failed. Please try again.");
    }
  };

  const handleFinish = () => {
    onPaymentComplete();
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div className={`fixed inset-0 z-[120] flex flex-col bg-white dark:bg-[#0F172A] transition-transform duration-300 safe-area-pb ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>

      {/* SUCCESS STATE (Consolidated) */}
      {status === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in overflow-y-auto">
          {/* Header Icon */}
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce-small shrink-0">
            <CheckCircle2 size={48} className="text-green-600 dark:text-green-400 fill-green-600/20" strokeWidth={1.5} />
          </div>

          {/* Success Text */}
          <h2 className="text-2xl font-display font-bold text-[#0F172A] dark:text-white mb-2">
            Payment Successful!
          </h2>

          <p className="text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-xs mx-auto">
            Thank you, {guestName}. We hope you enjoyed your meal.
          </p>

          {/* Footer Actions (Simple) */}
          <div className="w-full max-w-xs space-y-3 animate-fade-in">
            <button
              onClick={handleFinish}
              className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg flex justify-center items-center uppercase tracking-wider hover:bg-orange-700 transition-all active:scale-95"
            >
              Close Session
            </button>

            <button
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              className="w-full py-3 bg-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isDownloading && <Loader2 size={16} className="animate-spin" />}
              {isDownloading ? "Generating Receipt..." : "Download Receipt"}
            </button>
          </div>
        </div>
      )}

      {/* PAYMENT FORM STATE (IDLE / PROCESSING) */}
      {(status === 'idle' || status === 'processing') && (
        <>
          {/* HEADER */}
          <div className="px-6 py-4 bg-white dark:bg-[#0F172A] border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-full text-slate-600 dark:text-slate-300">
                <Receipt size={20} />
              </div>
              <h1 className="text-lg font-display font-bold text-[#0F172A] dark:text-white">
                Bill Summary
              </h1>
            </div>
            {status !== 'processing' && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32">

            {/* BILL CARD (Simplified) */}
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 mb-8">

              {/* Added: Item List Summary */}
              <div className="mb-4 pb-4 border-b border-slate-200 dark:border-white/10 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order Summary</h4>
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-[#0F172A] dark:text-slate-200">
                    <span>{item.quantity} x {item.name}</span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
                  <span>GST (5%)</span>
                  <span>₹{gst}</span>
                </div>
                <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
                  <span>Service Charge (2.5%)</span>
                  <span>₹{serviceCharge}</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="font-bold text-lg text-[#0F172A] dark:text-white">Total</span>
                <span className="font-display font-bold text-2xl text-[#0F172A] dark:text-white">₹{total}</span>
              </div>
            </div>

            {/* PAYMENT METHODS (Simplified) */}
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Payment Method
            </h3>

            <div className="flex flex-col gap-3 mb-8">
              {[
                { id: 'upi', label: 'UPI / GPay', icon: QrCode },
                { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                { id: 'cash', label: 'Cash', icon: Wallet },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMethod(opt.id as any)}
                  disabled={status === 'processing'}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                    ${method === opt.id
                      ? 'border-[#FF5722] bg-orange-50 dark:bg-orange-900/20 text-[#FF5722]'
                      : 'border-slate-100 dark:border-white/10 bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:border-orange-200'}
                  `}
                >
                  <div className={`p-2 rounded-lg ${method === opt.id ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                    <opt.icon size={20} strokeWidth={2} />
                  </div>
                  <span className="font-bold text-base">{opt.label}</span>
                  {method === opt.id && <CheckCircle2 size={20} className="ml-auto fill-orange-500 text-white" />}
                </button>
              ))}
            </div>

          </div>

          {/* FOOTER ACTION */}
          {/* FOOTER ACTION (Refactored) */}
          <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0F172A] border-t border-slate-100 dark:border-white/5 p-6 z-[130]">
            <div className="w-full max-w-md mx-auto">
              <button
                onClick={handleConfirm}
                disabled={!method || status === 'processing'}
                className={`
                w-full bg-orange-600 text-white font-bold py-3 rounded-lg flex justify-center items-center uppercase tracking-wider hover:bg-orange-700 transition-all active:scale-95
                ${!method || status === 'processing' ? 'opacity-50 cursor-not-allowed bg-slate-400' : ''}
              `}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <span>PAY ₹{total}</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};