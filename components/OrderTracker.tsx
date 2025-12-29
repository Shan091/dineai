import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Utensils,
  FileText,
  CheckCircle2,
  Bell,
  ArrowRight,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Receipt,
  Check,
  Bike
} from 'lucide-react';
import { CartItem } from './SmartCart';
import { PaymentModal } from './PaymentModal';
import { ServiceRequestModal } from './ServiceRequestModal';

// Export type for use in parent
export type OrderStatus = 'placed' | 'ready' | 'served' | 'paid' | 'cancelled';

interface OrderTrackerProps {
  status: OrderStatus; // Controlled by parent
  onBackToMenu: () => void;
  onViewKitchen: () => void;
  onCancelOrder: () => void; // New prop for cancellation
  onReset: () => void; // New Prop for full reset
  onPaymentSuccess: () => void; // Handler for tracking pill removal
  onRequestService: (type: string) => void;
  cartsItems: CartItem[]; // Typo in original file? No, it was cartItems.
  cartItems: CartItem[];
  guestName?: string;
  onSettleSession?: () => Promise<void>;
  orderId?: string; // New Prop

  // New State Props
  isPaymentOpen: boolean;
  onTogglePayment: (isOpen: boolean) => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  status,
  onBackToMenu,
  onViewKitchen,
  onCancelOrder,
  onReset,
  onPaymentSuccess,
  onRequestService,
  cartItems,
  guestName = "Guest",
  onSettleSession,
  isPaymentOpen,
  onTogglePayment,
  orderId
}) => {

  const [waiterCalled, setWaiterCalled] = useState(false);
  // ... (rest of component)

  // ... (inside render)
  <PaymentModal
    isOpen={isPaymentOpen}
    onClose={() => onTogglePayment(false)}
    onPaymentComplete={onReset}
    onPay={onSettleSession}
    onKeepOrdering={() => {
      onTogglePayment(false);
      // Trigger the handler to clear order state
      onPaymentSuccess();
    }}
    cartItems={cartItems}
    guestName={guestName}
    orderId={orderId}
  />
  const [billRequested, setBillRequested] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);
  // const [showPayment, setShowPayment] = useState(false); // LIFTED

  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [toastRequest, setToastRequest] = useState<string | null>(null);

  // Feedback State
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});

  // --- SECRET TAP LOGIC ---
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (secretClicks > 0) {
      timer = setTimeout(() => setSecretClicks(0), 2000);
    }

    if (secretClicks >= 5) {
      onViewKitchen();
      setSecretClicks(0);
    }

    return () => clearTimeout(timer);
  }, [secretClicks, onViewKitchen]);

  const handleSecretTap = () => {
    setSecretClicks(prev => prev + 1);
  };

  // --- WAITER/BILL LOGIC ---
  const handleOpenServiceModal = () => {
    setShowServiceModal(true);
  };

  const handleServiceRequest = (requestType: string) => {
    setShowServiceModal(false);
    onRequestService(requestType); // Call backend
    setWaiterCalled(true);
    setToastRequest(`Request Sent: Bringing ${requestType} to Table 4.`);

    // Reset after 2 minutes (120000ms) - Cooldown
    setTimeout(() => {
      setWaiterCalled(false);
    }, 120000);

    // Hide toast after 4s
    setTimeout(() => setToastRequest(null), 4000);
  };

  const handleRequestBill = () => {
    setBillRequested(true);
    onRequestService('Request Bill'); // Call backend
    onTogglePayment(true);
  };

  const handleFeedback = (itemId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [itemId]: type
    }));
  };

  // --- VISUAL LOGIC ---
  const isCancelled = status === 'cancelled';
  const isPaid = status === 'paid';
  const isServed = (status === 'served' || status === 'paid'); // Paid implies served
  const isCookingState = (status === 'placed' || status === 'ready') && !isCancelled;
  const canCancel = status === 'placed' && !isCancelled;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0F172A] flex flex-col animate-fade-in overflow-y-auto">

      {/* HEADER WITH SECRET TAP */}
      <header className="px-6 py-4 bg-white dark:bg-[#0F172A] border-b border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div
          className="flex flex-col cursor-default select-none"
          onClick={handleSecretTap}
        >
          <h1 className="font-display font-bold text-lg text-secondary dark:text-white leading-none tracking-tight">
            The Malabar House
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`relative flex h-2 w-2 ${isPaid ? 'hidden' : ''}`}>
              {!isCancelled && !isPaid && (
                <>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isServed ? 'bg-emerald-400' : 'bg-orange-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isServed ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
                </>
              )}
              {isCancelled && <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {isPaid ? 'Table #4 • Session Complete' : isServed ? 'Table #4 • Enjoy your meal' : isCancelled ? 'Table #4 • Order Cancelled' : 'Table #4 • Live Status'}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center pt-16 px-6 pb-40 text-center">

        {/* DYNAMIC HERO */}
        <div className="mb-10 animate-fade-in-up w-full">
          <div className="relative inline-block mb-8">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center mb-6 transition-all duration-500 mx-auto
              ${isCookingState ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 animate-pulse' : ''}
              ${isServed && !isPaid ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : ''}
              ${isPaid ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : ''}
              ${isCancelled ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : ''}
            `}>
              {isCookingState && <ChefHat size={64} strokeWidth={1.5} />}
              {isServed && !isPaid && <Utensils size={64} strokeWidth={1.5} />}
              {isPaid && <CheckCircle2 size={64} strokeWidth={1.5} />}
              {isCancelled && <div className="text-4xl font-bold">❌</div>}
            </div>

            {isCookingState && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg bg-orange-500 text-white whitespace-nowrap z-10">
                Preparing Now
              </div>
            )}
          </div>

          <h2 className="text-3xl font-display font-bold text-[#0F172A] dark:text-white mb-3">
            {isCookingState && "Chef is preparing your meal"}
            {isServed && !isPaid && `Enjoy your meal, ${guestName}!`}
            {isPaid && "All Set! Thank you."}
            {isCancelled && "This order was cancelled"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-base leading-relaxed">
            {isCookingState && "We're using fresh ingredients to craft your dish with care. It will be served shortly."}
            {isServed && !isPaid && "Bon Appétit! Feel free to order more or pay when you're ready."}
            {isPaid && "Your payment was successful. We hope you had a wonderful dining experience."}
            {isCancelled && "Please contact the staff if this was a mistake."}
          </p>

          {/* CANCELLATION BUTTON */}
          {canCancel && (
            <button
              onClick={onCancelOrder}
              className="mt-4 text-sm font-bold text-red-500 hover:text-red-600 underline decoration-red-200 underline-offset-4 active:scale-95 transition-all"
            >
              Cancel Order
            </button>
          )}

        </div>

      </div>

      {/* FOOTER ACTIONS (COMMAND DECK) */}
      <div className="contents"> {/* Changed to contents to remove wrapper behavior but keep structure */}


        {/* PAID VIEW - THANK YOU */}
        {status === 'paid' ? (
          <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0F172A] border-t border-gray-100 dark:border-white/5 p-6 z-[60]">
            <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
              <div className="text-center mb-2">
                <h3 className="text-xl font-display font-bold text-green-600 dark:text-green-500 mb-1">Payment Successful</h3>
                <p className="text-sm text-slate-500">Thank you for dining with us!</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className="w-full py-4 bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-xl font-display font-bold text-lg shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Start New Session <ArrowRight size={20} />
              </button>
            </div>
          </div>
        ) : isServed ? (
          /* SERVED VIEW - ENJOY & ACTIONS */
          <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0F172A] border-t border-gray-100 dark:border-white/5 p-6 z-[60]">
            <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onBackToMenu}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Utensils size={18} />
                  Order More
                </button>

                <button
                  onClick={() => onTogglePayment(true)}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-display font-bold text-lg shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 animate-pulse-slow"
                >
                  <Receipt size={18} />
                  Pay Now
                </button>
              </div>

              <button
                onClick={handleOpenServiceModal}
                className="w-full py-3 text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <Bell size={14} />
                {waiterCalled ? 'Waiter summoned' : 'Need help? Call Waiter'}
              </button>
            </div>
          </div>
        ) : (


          /* COOKING / PLACED VIEW */
          <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0F172A] p-4 border-t border-gray-100 dark:border-white/5 flex flex-col gap-3 z-40">
            <button
              onClick={handleOpenServiceModal}
              disabled={waiterCalled}
              className={`
                  w-full py-3 border rounded-lg font-medium transition-all flex items-center justify-center gap-2
                  ${waiterCalled
                  ? 'border-red-200 text-red-400 cursor-default'
                  : 'border-red-500 text-red-500 active:bg-red-50'
                }
                `}
            >
              {waiterCalled ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  <span>Request Sent</span>
                </>
              ) : (
                <>
                  <Bell size={16} />
                  <span>Call Waiter</span>
                </>
              )}
            </button>

            <button
              onClick={onBackToMenu}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              Browse Menu <ArrowRight size={16} />
            </button>
          </div>
        )
        }
      </div >

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => onTogglePayment(false)}
        onPaymentComplete={onReset}
        onPay={onSettleSession}
        onKeepOrdering={() => {
          onTogglePayment(false);
          // Trigger the handler to clear order state
          onPaymentSuccess();
        }}
        cartItems={cartItems}
        guestName={guestName}
        orderId={orderId} // Pass it down
      />

      <ServiceRequestModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onRequest={handleServiceRequest}
      />

      {/* Toast Notification for Request */}
      {
        toastRequest && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] px-5 py-3 rounded-full text-sm font-bold shadow-xl animate-fade-in-up whitespace-nowrap z-[130] flex items-center gap-2">
            <Check size={16} className="text-green-500" strokeWidth={3} />
            {toastRequest}
          </div>
        )
      }

    </div >
  );
};