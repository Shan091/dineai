import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Leaf,
  Drumstick,
  Egg,
  ChefHat,
  User,
  Check,
  ShieldCheck,
  ShieldAlert,
  X,
  Sparkles,
  AlertCircle,
  Target
} from 'lucide-react';
import { db, UserPreferences, DietaryType, SpiceLevel } from '../services/db';

interface ConciergeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onSessionInfo: (name: string, table: string) => void;
  phoneNumber: string;
  initialData?: UserPreferences;
  isReturningUser?: boolean;
}

// --- CONSTANTS ---

const ALLERGENS = [
  { id: 'peanuts', label: 'Nuts 🥜' },
  { id: 'dairy', label: 'Dairy 🥛' },
  { id: 'shellfish', label: 'Shellfish 🦐' },
  { id: 'gluten', label: 'Gluten 🍞' },
  { id: 'soy', label: 'Soy 🫘' },
  { id: 'egg', label: 'Egg 🥚' },
  { id: 'fish', label: 'Fish 🐟' }
];

const DIETARY_GOALS = [
  { id: 'balanced', label: '🥗 Balanced', desc: '' },
  { id: 'protein', label: '💪 High Protein', desc: '' },
  { id: 'low-cal', label: '📉 Low Calorie', desc: '' },
  { id: 'keto', label: '🥑 Keto', desc: '(Low Carb)' },
  { id: 'sugar', label: '🩸 Sugar-Conscious', desc: '(Low Glycemic)' },
  { id: 'heart', label: '❤️ Heart-Healthy', desc: '(Low Salt/Oil)' },
  { id: 'gut', label: '🌿 Gut-Friendly', desc: '(Low FODMAP)' },
  { id: 'vegan', label: '🌱 Vegan', desc: '' },
  { id: 'paleo', label: '🍖 Paleo', desc: '(Whole Foods)' },
  { id: 'jain', label: '🕉️ Jain', desc: '(No Root Veg)' }
];

const CRAVING_TAGS = [
  { id: 'biryani', label: 'Biryani 🥘' },
  { id: 'curry', label: 'Curry 🥣' },
  { id: 'fry', label: 'Fry 🍗' },
  { id: 'rice', label: 'Rice 🍚' },
  { id: 'bread', label: 'Breads 🍞' },
  { id: 'spicy', label: 'Spicy 🌶️' },
  { id: 'sweet', label: 'Sweet 🍭' }
];

const LOADING_MESSAGES = [
  "Analyzing Preferences...",
  "Checking Dietary Needs...",
  "Matching Flavors...",
  "Menu Curated."
];

const ConciergeWizard: React.FC<ConciergeWizardProps> = ({ isOpen, onClose, onComplete, onSessionInfo, phoneNumber, initialData, isReturningUser }) => {
  const [step, setStep] = useState<0 | 1>(0);
  const [isClosing, setIsClosing] = useState(false);
  const [hasSavedPrefs, setHasSavedPrefs] = useState(false);
  const [isAutoSkipped, setIsAutoSkipped] = useState(false);

  // AI Curation State
  const [isCurating, setIsCurating] = useState(false);
  const [curationMessage, setCurationMessage] = useState(LOADING_MESSAGES[0]);

  // Step 0: Identity
  const [guestName, setGuestName] = useState('');
  const tableNumber = '4'; // Fixed internally as per requirement

  // Step 1: Preferences
  const [dietary, setDietary] = useState<DietaryType>('non-veg');
  const [selectedCravings, setSelectedCravings] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [healthGoals, setHealthGoals] = useState<string[]>([]);

  // Modals
  const [showAllergyModal, setShowAllergyModal] = useState(false);

  // Sync state when wizard opens
  useEffect(() => {
    if (isOpen) {
      setIsCurating(false);

      // 1. Check LocalStorage for User Identity (Auto-Login)
      const savedName = localStorage.getItem('malabar_user');
      const localSavedPrefs = localStorage.getItem('malabar_preferences');

      let prefs: UserPreferences | undefined = undefined;
      let remembered = false;

      // 2. Load Preferences (DB > LocalStorage)
      if (isReturningUser && initialData) {
        prefs = initialData;
        remembered = true;
      } else if (localSavedPrefs) {
        try {
          prefs = JSON.parse(localSavedPrefs);
          remembered = true;
        } catch (e) {
          console.error("Failed to load local preferences", e);
        }
      }

      // 3. Hydrate Preferences State
      if (prefs) {
        setDietary(prefs.dietary || 'non-veg');
        setSelectedCravings(prefs.cravings || []);
        setSelectedAllergens(prefs.allergens || []);
        setHealthGoals(prefs.healthGoals || []);
        setHasSavedPrefs(remembered);
      } else {
        setDietary('non-veg');
        setSelectedCravings([]);
        setSelectedAllergens([]);
        setHealthGoals([]);
        setHasSavedPrefs(false);
      }

      // 4. AUTO-SKIP LOGIC: Determine Step based on Name existence
      if (savedName) {
        setGuestName(savedName);
        setStep(1); // SKIP Step 0 -> Go straight to Preferences
        setIsAutoSkipped(true);
      } else {
        setGuestName('');
        setStep(0); // Show Identity Input
        setIsAutoSkipped(false);
      }
    }
  }, [isOpen, initialData, isReturningUser]);

  // AI Loading Animation Effect
  useEffect(() => {
    if (isCurating) {
      let msgIndex = 0;
      const interval = setInterval(() => {
        msgIndex = (msgIndex + 1);
        if (msgIndex < LOADING_MESSAGES.length) {
          setCurationMessage(LOADING_MESSAGES[msgIndex]);
        }
      }, 400); // Change text every 400ms

      return () => clearInterval(interval);
    }
  }, [isCurating]);

  // --- HANDLERS ---

  const handleIdentitySubmit = () => {
    if (!guestName.trim()) return;

    // Save Identity to LocalStorage
    localStorage.setItem('malabar_user', guestName.trim());

    onSessionInfo(guestName, tableNumber);
    setStep(1);
    setIsAutoSkipped(false); // Manually entered
  };

  const handleEditIdentity = () => {
    // Clear saved identity to allow re-entry
    localStorage.removeItem('malabar_user');
    setGuestName('');
    setStep(0);
    setIsAutoSkipped(false);
  };

  const toggleCraving = (id: string) => {
    setSelectedCravings(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleGoal = (id: string) => {
    setHealthGoals(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    // Auto-set veg if vegan/jain is selected
    if ((id === 'vegan' || id === 'jain') && !healthGoals.includes(id)) {
      setDietary('veg');
    }
  };

  const toggleAllergen = (id: string) => {
    setSelectedAllergens(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const startCuration = async () => {
    // 1. Enter AI Mode
    setIsCurating(true);

    // 2. Prepare Data
    const inferredSpice: SpiceLevel = selectedCravings.includes('spicy') ? 'fiery' : 'medium';
    const finalPreferences: UserPreferences = {
      dietary,
      allergens: selectedAllergens,
      healthGoals: healthGoals,
      diningContext: [],
      spiceLevel: inferredSpice,
      cravings: selectedCravings
    };

    // 3. PERSISTENCE: Save to Local Storage for next time
    localStorage.setItem('malabar_preferences', JSON.stringify(finalPreferences));

    // Ensure Parent has the latest Name (in case Step 0 was skipped)
    onSessionInfo(guestName, tableNumber);

    // 4. Save to DB (Async)
    try {
      await db.savePreferences(phoneNumber, finalPreferences);
    } catch (error) {
      console.error('Failed to save', error);
    }

    // 5. Wait for Animation (Total 1.5s approx)
    setTimeout(() => {
      onComplete();
      handleClose();
      setIsCurating(false);
    }, 1600);
  };

  const handleSkip = () => {
    onComplete();
    handleClose();
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}`}
        onClick={isCurating ? undefined : handleClose}
      />

      <div className={`fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-[#0F172A] rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out transform ${isOpen && !isClosing ? 'translate-y-0' : 'translate-y-full'} max-h-[95vh] overflow-hidden flex flex-col`}>

        {/* Progress Bar (Hidden during AI Loading) */}
        {!isCurating && (
          <div className="absolute top-0 left-0 right-0 h-1.5 z-10 bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-[#FF5722] transition-all duration-500 ease-out"
              style={{ width: step === 0 ? '30%' : '100%' }}
            />
          </div>
        )}

        {/* AI LOADING OVERLAY */}
        {isCurating && (
          <div className="absolute inset-0 z-50 bg-[#0F172A] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#FF5722] rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-[#1E293B] rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                <Sparkles className="w-8 h-8 text-[#FF5722] animate-spin-slow" />
              </div>
            </div>

            <h3 className="text-xl font-display font-bold text-white mb-2 tracking-tight animate-fade-in-up">
              {curationMessage}
            </h3>
            <p className="text-slate-400 text-sm">
              Personalizing menu for {guestName}...
            </p>
          </div>
        )}

        {/* MAIN SLIDER CONTAINER */}
        <div
          className="flex-1 flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${step * 100}%)` }}
        >

          {/* ==============================================
              STEP 1: IDENTITY (Slide 1)
             ============================================== */}
          <div className="w-full shrink-0 flex flex-col p-6 pb-10 min-h-[50vh]">
            <div className="h-10" /> {/* Spacer */}

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 text-[#FF5722] mb-4 shadow-sm animate-bounce-small">
                <ChefHat className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-display font-bold text-[#0F172A] dark:text-white mb-2">
                Welcome to The Malabar House
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Let's personalize your menu. What should we call you?
              </p>
            </div>

            <div className="space-y-6 mb-8 max-w-sm mx-auto w-full">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                  Your Name
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#FF5722] transition-colors" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIdentitySubmit()}
                    placeholder="e.g. Rahul"
                    autoFocus
                    className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-lg font-bold text-[#0F172A] dark:text-white outline-none focus:border-[#FF5722]/50 focus:bg-white dark:focus:bg-black/40 transition-all placeholder:font-normal"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleIdentitySubmit}
              disabled={!guestName}
              className="w-full max-w-sm mx-auto py-4 bg-[#FF5722] text-white rounded-2xl font-display font-bold text-lg shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-auto hover:bg-[#F4511E]"
            >
              Get Started
            </button>
          </div>

          {/* ==============================================
              STEP 2: PREFERENCES (Slide 2)
             ============================================== */}
          <div className="w-full shrink-0 flex flex-col p-6 pb-10 min-h-[50vh] overflow-y-auto">

            {/* Header with Reset Identity Button - CONDITIONAL */}
            <div className="flex items-center justify-between mb-4 min-h-[32px]">
              {!isAutoSkipped && (
                <button
                  onClick={handleEditIdentity}
                  className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-xs font-bold">Not {guestName}?</span>
                </button>
              )}
            </div>

            {/* TITLE */}
            <h3 className="font-display font-bold text-2xl text-[#0F172A] dark:text-white mb-6">
              {hasSavedPrefs ? (
                <>
                  Hi {guestName}, <span className="text-orange-500 dark:text-orange-400">we remembered your favorites!</span>
                </>
              ) : (
                <>
                  Hi {guestName}, <span className="text-slate-400">how are you eating today?</span>
                </>
              )}
            </h3>

            {/* SAFETY BAR */}
            <button
              onClick={() => setShowAllergyModal(true)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl mb-8 transition-all border active:scale-[0.98] shadow-sm ${selectedAllergens.length > 0
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${selectedAllergens.length > 0 ? 'bg-red-100 dark:bg-red-800' : 'bg-green-100 dark:bg-green-800'}`}>
                  {selectedAllergens.length > 0 ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                </div>
                <span className="text-sm font-bold">
                  {selectedAllergens.length > 0
                    ? `Avoiding ${selectedAllergens.length} Allergens`
                    : '✅ No Allergies set'}
                </span>
              </div>
              <span className="text-xs font-bold underline decoration-current underline-offset-2 opacity-80">
                {selectedAllergens.length > 0 ? 'Edit' : 'Tap to set'}
              </span>
            </button>

            {/* SECTION A: DIET TOGGLE */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
                Dietary Preference
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setDietary('veg')}
                  className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-200 border-2 ${dietary === 'veg'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 shadow-sm'
                      : 'bg-white dark:bg-white/5 border-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
                    }`}
                >
                  <Leaf className="w-5 h-5" />
                  <span className="text-xs font-bold">Veg</span>
                </button>
                <button
                  onClick={() => setDietary('non-veg')}
                  className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-200 border-2 ${dietary === 'non-veg'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 shadow-sm'
                      : 'bg-white dark:bg-white/5 border-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
                    }`}
                >
                  <Drumstick className="w-5 h-5" />
                  <span className="text-xs font-bold">Non-Veg</span>
                </button>
                <button
                  onClick={() => setDietary('egg')}
                  className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-200 border-2 ${dietary === 'egg'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400 shadow-sm'
                      : 'bg-white dark:bg-white/5 border-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
                    }`}
                >
                  <Egg className="w-5 h-5" />
                  <span className="text-xs font-bold">Egg</span>
                </button>
              </div>
            </div>

            {/* SECTION B: DIETARY GOALS (Horizontal Scroll) */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
                Dietary Goals
              </label>
              <div className="flex overflow-x-auto gap-3 pb-2 -mx-6 px-6 no-scrollbar snap-x">
                {DIETARY_GOALS.map((goal) => {
                  const isActive = healthGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`
                          snap-start flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm whitespace-nowrap transition-all
                          ${isActive
                          ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500'
                          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                        }
                        `}
                    >
                      {isActive && <Target size={14} />}
                      <span className="font-semibold">{goal.label}</span>
                      {goal.desc && <span className="text-xs opacity-70 font-normal">{goal.desc}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION C: CRAVING CLOUD (Grid) */}
            <div className="mb-8 flex-1">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  What are you in the mood for?
                </label>
                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">Multi-select</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {CRAVING_TAGS.map((tag) => {
                  const isActive = selectedCravings.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleCraving(tag.id)}
                      className={`
                          py-2.5 px-4 rounded-full font-bold text-sm transition-all duration-200 border shadow-sm flex items-center gap-2
                          ${isActive
                          ? 'bg-[#FF5722] border-[#FF5722] text-white scale-[1.05] shadow-orange-500/30'
                          : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-orange-200 dark:hover:border-white/20'
                        }
                        `}
                    >
                      {tag.label}
                      {isActive && <Check size={14} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-auto space-y-4">
              <button
                onClick={startCuration}
                className={`
                    w-full py-4 bg-gradient-to-r from-[#FF5722] to-[#FF8A65] text-white rounded-2xl 
                    font-display font-bold text-lg shadow-glow-orange active:scale-[0.98] transition-transform 
                    flex items-center justify-center gap-2
                  `}
              >
                {selectedCravings.length > 0 ? (
                  <>
                    <Sparkles size={20} className="fill-white/20" />
                    Find My Food ➔
                  </>
                ) : (
                  "Show Menu ➔"
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={handleSkip}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-2 px-4 underline decoration-slate-300 underline-offset-4"
                >
                  Skip & Browse Menu
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ALLERGY MODAL OVERLAY */}
        {showAllergyModal && (
          <div className="absolute inset-0 z-[80] bg-white dark:bg-[#0F172A] flex flex-col animate-slide-in-right">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/20">
              <h3 className="font-display font-bold text-lg text-[#0F172A] dark:text-white flex items-center gap-2">
                <AlertCircle className="text-red-500" size={20} />
                Allergy Check
              </h3>
              <button
                onClick={() => setShowAllergyModal(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                Tap any ingredient you need to avoid. We will strictly filter the menu for your safety.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ALLERGENS.map((allergen) => {
                  const isSelected = selectedAllergens.includes(allergen.id);
                  return (
                    <button
                      key={allergen.id}
                      onClick={() => toggleAllergen(allergen.id)}
                      className={`
                          py-3.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 border flex items-center justify-center gap-2
                          ${isSelected
                          ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }
                        `}
                    >
                      {isSelected && <ShieldAlert size={16} />}
                      {allergen.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => setShowAllergyModal(false)}
                className="w-full py-4 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-2xl font-bold active:scale-[0.98] transition-transform shadow-lg"
              >
                Save Allergies
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default ConciergeWizard;