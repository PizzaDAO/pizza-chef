import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { GameState, WorkerTraining } from '../types/game';
import { Store, DollarSign, X } from 'lucide-react';
import PizzaSliceStack from './PizzaSliceStack';
import { sprite } from '../lib/assets';
import { getUpgradeCost, getSpeedUpgradeCost } from '../logic/storeSystem';
import { COSTS, WORKER_CONFIG } from '../lib/constants';
import { getWorkerRankTitle, getNextUnlock, getTotalTrainingLevel } from '../logic/workerSystem';

// Power-up images (served from Cloudflare)
const beerImg = sprite("beer.png");
const honeyImg = sprite("hot-honey.png");
const sundaeImg = sprite("sundae.png");

interface ItemStoreProps {
  gameState: GameState;
  onUpgradeOven: (lane: number) => void;
  onUpgradeOvenSpeed: (lane: number) => void;
  onBribeReviewer: () => void;
  onBuyPowerUp: (type: 'beer' | 'ice-cream' | 'honey') => void;
  onHireWorker: () => void;
  onTrainWorker: (stat: keyof WorkerTraining) => void;
  onClose: () => void;
}

const ItemStore: React.FC<ItemStoreProps> = ({
  gameState,
  onUpgradeOven,
  onUpgradeOvenSpeed,
  onBribeReviewer,
  onBuyPowerUp,
  onHireWorker,
  onTrainWorker,
  onClose,
}) => {
  const maxUpgradeLevel = 7;
  const maxSpeedUpgradeLevel = 3;
  const bribeCost = 25;
  const powerUpCost = 5;

  // Track if player made any purchase this session (for retirement joke)
  const madePurchaseRef = useRef(false);
  const [showRetirementQuip, setShowRetirementQuip] = useState(false);

  // Custom close handler that shows retirement joke if no purchase was made
  const handleClose = useCallback(() => {
    if (!madePurchaseRef.current && gameState.bank > 0) {
      setShowRetirementQuip(true);
      setTimeout(() => {
        setShowRetirementQuip(false);
        onClose();
      }, 2000);
    } else {
      onClose();
    }
  }, [gameState.bank, onClose]);

  const getOvenUpgradeLevel = (lane: number) => gameState.ovenUpgrades[lane] || 0;
  const getOvenSpeedUpgradeLevel = (lane: number) => gameState.ovenSpeedUpgrades[lane] || 0;
  const getLaneUpgradeCost = (lane: number) => getUpgradeCost(getOvenUpgradeLevel(lane));
  const getLaneSpeedUpgradeCost = (lane: number) => getSpeedUpgradeCost(getOvenSpeedUpgradeLevel(lane));
  const canAffordUpgrade = (lane: number) => gameState.bank >= getLaneUpgradeCost(lane);
  const canAffordSpeedUpgrade = (lane: number) => gameState.bank >= getLaneSpeedUpgradeCost(lane);

  const getSpeedUpgradeText = (level: number) => {
    if (level === 0) return 'Base: 3s';
    if (level === 1) return '2.5s';
    if (level === 2) return '2s';
    return '1.5s';
  };

  // Navigation indices:
  // Left side (ovens): 4 rows x 2 cols = indices 0-7
  // Right side:
  //   Bribe = 8
  //   Power-ups = 9, 10, 11
  //   Hire Worker (if not hired) = 12, or Training stats (if hired) = 12, 13, 14
  // Bottom: Continue = 15 (or 13 if not hired)

  const workerAlreadyHired = !!gameState.hiredWorker?.active;
  const hasSavedTraining = !!gameState.workerTrainingSaved;
  const CONTINUE_INDEX = workerAlreadyHired ? 15 : 13;

  const [selectedIndex, setSelectedIndex] = useState(CONTINUE_INDEX); // Start on Continue
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const hireCost = COSTS.HIRE_WORKER;
  const canAffordWorker = gameState.bank >= hireCost;

  // Training stat info
  const trainingStats: { key: keyof WorkerTraining; label: string; index: number }[] = [
    { key: 'speed', label: 'Speed', index: 12 },
    { key: 'capacity', label: 'Capacity', index: 13 },
    { key: 'hustle', label: 'Hustle', index: 14 },
  ];

  const getTrainingCost = (stat: string, level: number): number | null => {
    if (level >= WORKER_CONFIG.MAX_STAT_LEVEL) return null;
    const costs = WORKER_CONFIG.TRAINING_COSTS[stat];
    return costs ? costs[level] : null;
  };

  const menuActions = useMemo(() => {
    const actions: (() => void)[] = [
      () => { madePurchaseRef.current = true; onUpgradeOvenSpeed(0); },
      () => { madePurchaseRef.current = true; onUpgradeOven(0); },
      () => { madePurchaseRef.current = true; onUpgradeOvenSpeed(1); },
      () => { madePurchaseRef.current = true; onUpgradeOven(1); },
      () => { madePurchaseRef.current = true; onUpgradeOvenSpeed(2); },
      () => { madePurchaseRef.current = true; onUpgradeOven(2); },
      () => { madePurchaseRef.current = true; onUpgradeOvenSpeed(3); },
      () => { madePurchaseRef.current = true; onUpgradeOven(3); },
      () => { madePurchaseRef.current = true; onBribeReviewer(); },
      () => { madePurchaseRef.current = true; onBuyPowerUp('beer'); },
      () => { madePurchaseRef.current = true; onBuyPowerUp('ice-cream'); },
      () => { madePurchaseRef.current = true; onBuyPowerUp('honey'); },
    ];

    if (workerAlreadyHired) {
      // 12-14: training stats
      actions.push(() => { madePurchaseRef.current = true; onTrainWorker('speed'); });
      actions.push(() => { madePurchaseRef.current = true; onTrainWorker('capacity'); });
      actions.push(() => { madePurchaseRef.current = true; onTrainWorker('hustle'); });
      // 15: continue
      actions.push(handleClose);
    } else {
      // 12: hire worker
      actions.push(() => { madePurchaseRef.current = true; onHireWorker(); });
      // 13: continue
      actions.push(handleClose);
    }

    return actions;
  }, [onUpgradeOvenSpeed, onUpgradeOven, onBribeReviewer, onBuyPowerUp, onHireWorker, onTrainWorker, handleClose, workerAlreadyHired]);

  // Focus selected element
  useEffect(() => {
    itemRefs.current[selectedIndex]?.focus();
  }, [selectedIndex]);

  // Store refs for stable access in event handler
  const selectedIndexRef = useRef(selectedIndex);
  const menuActionsRef = useRef(menuActions);
  const onCloseRef = useRef(onClose);
  const handleCloseRef = useRef(handleClose);
  const gameStateRef = useRef(gameState);
  const continueIndexRef = useRef(CONTINUE_INDEX);
  const workerHiredRef = useRef(workerAlreadyHired);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    menuActionsRef.current = menuActions;
  }, [menuActions]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    continueIndexRef.current = CONTINUE_INDEX;
  }, [CONTINUE_INDEX]);

  useEffect(() => {
    workerHiredRef.current = workerAlreadyHired;
  }, [workerAlreadyHired]);

  // Helper to check if a button at given index is disabled
  const isDisabledAt = (index: number, gs: GameState): boolean => {
    // Oven speed buttons (0, 2, 4, 6)
    if (index % 2 === 0 && index <= 6) {
      const lane = index / 2;
      const speedLevel = gs.ovenSpeedUpgrades[lane] || 0;
      const isMaxSpeed = speedLevel >= maxSpeedUpgradeLevel;
      const cost = getSpeedUpgradeCost(speedLevel);
      return isMaxSpeed || gs.bank < cost;
    }
    // Oven level buttons (1, 3, 5, 7)
    if (index % 2 === 1 && index <= 7) {
      const lane = (index - 1) / 2;
      const level = gs.ovenUpgrades[lane] || 0;
      const isMaxLevel = level >= maxUpgradeLevel;
      const cost = getUpgradeCost(level);
      return isMaxLevel || gs.bank < cost;
    }
    // Bribe (8)
    if (index === 8) {
      return gs.bank < bribeCost || gs.lives >= 5;
    }
    // Power-ups (9, 10, 11)
    if (index >= 9 && index <= 11) {
      return gs.bank < powerUpCost;
    }

    const hired = !!gs.hiredWorker?.active;

    if (hired) {
      // Training stats (12-14)
      if (index >= 12 && index <= 14) {
        const statKeys: (keyof WorkerTraining)[] = ['speed', 'capacity', 'hustle'];
        const stat = statKeys[index - 12];
        const training = gs.hiredWorker!.training;
        const currentLevel = training[stat] as number;
        if (currentLevel >= WORKER_CONFIG.MAX_STAT_LEVEL) return true;
        const costs = WORKER_CONFIG.TRAINING_COSTS[stat];
        if (!costs) return true;
        return gs.bank < costs[currentLevel];
      }
      // Continue (15)
      if (index === 15) return false;
    } else {
      // Hire Worker (12)
      if (index === 12) {
        return !!gs.hiredWorker?.active || gs.bank < COSTS.HIRE_WORKER;
      }
      // Continue (13)
      if (index === 13) return false;
    }
    return false;
  };

  // Custom navigation logic - stable handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape'].includes(key)) return;

      e.preventDefault();
      e.stopPropagation();

      if (key === 'Escape') {
        handleCloseRef.current();
        return;
      }

      if (key === 'Enter') {
        menuActionsRef.current[selectedIndexRef.current]?.();
        return;
      }

      setSelectedIndex(current => {
        const gs = gameStateRef.current;
        const contIdx = continueIndexRef.current;
        const hired = workerHiredRef.current;
        const disabled = (idx: number) => isDisabledAt(idx, gs);

        // Helper to find first non-disabled in a list, or return fallback
        const firstEnabled = (indices: number[], fallback: number) => {
          for (const idx of indices) {
            if (!disabled(idx)) return idx;
          }
          return fallback;
        };

        // In oven grid (0-7)
        if (current >= 0 && current <= 7) {
          const row = Math.floor(current / 2);
          const col = current % 2;

          if (key === 'ArrowUp') {
            for (let r = row - 1; r >= 0; r--) {
              const target = r * 2 + col;
              if (!disabled(target)) return target;
            }
            const otherCol = col === 0 ? 1 : 0;
            for (let r = row - 1; r >= 0; r--) {
              const target = r * 2 + otherCol;
              if (!disabled(target)) return target;
            }
            return current;
          }
          if (key === 'ArrowDown') {
            for (let r = row + 1; r <= 3; r++) {
              const target = r * 2 + col;
              if (!disabled(target)) return target;
            }
            const otherCol = col === 0 ? 1 : 0;
            for (let r = row + 1; r <= 3; r++) {
              const target = r * 2 + otherCol;
              if (!disabled(target)) return target;
            }
            return contIdx;
          }
          if (key === 'ArrowLeft') {
            if (col > 0) {
              const target = current - 1;
              if (!disabled(target)) return target;
            }
            return current;
          }
          if (key === 'ArrowRight') {
            if (col === 0) {
              const target = current + 1;
              if (!disabled(target)) return target;
            }
            if (row <= 1) {
              if (!disabled(8)) return 8;
              return firstEnabled([9, 10, 11, 12], current);
            }
            return firstEnabled([9, 10, 11, 12], current);
          }
        }

        // At Bribe (8)
        if (current === 8) {
          if (key === 'ArrowLeft') return firstEnabled([1, 0, 3, 2], current);
          if (key === 'ArrowDown') return firstEnabled([9, 10, 11, 12, contIdx], current);
          if (key === 'ArrowUp') return firstEnabled([1, 0, 3, 2], current);
          if (key === 'ArrowRight') return current;
        }

        // At Power-ups (9-11)
        if (current >= 9 && current <= 11) {
          const powerUpCol = current - 9;
          if (key === 'ArrowLeft') {
            for (let i = powerUpCol - 1; i >= 0; i--) {
              if (!disabled(9 + i)) return 9 + i;
            }
            return firstEnabled([5, 4, 7, 6], current);
          }
          if (key === 'ArrowRight') {
            for (let i = powerUpCol + 1; i <= 2; i++) {
              if (!disabled(9 + i)) return 9 + i;
            }
            return current;
          }
          if (key === 'ArrowUp') {
            if (!disabled(8)) return 8;
            return current;
          }
          if (key === 'ArrowDown') return firstEnabled([12, 13, 14, contIdx], current);
        }

        if (hired) {
          // Training stats (12-14)
          if (current >= 12 && current <= 14) {
            if (key === 'ArrowUp') {
              return firstEnabled([9, 10, 11, 8], current);
            }
            if (key === 'ArrowDown') return contIdx;
            if (key === 'ArrowLeft') {
              if (current > 12) {
                const target = current - 1;
                if (!disabled(target)) return target;
              }
              return firstEnabled([5, 4, 7, 6], current);
            }
            if (key === 'ArrowRight') {
              if (current < 14) {
                const target = current + 1;
                if (!disabled(target)) return target;
              }
              return current;
            }
          }

          // Continue (15)
          if (current === 15) {
            if (key === 'ArrowUp') {
              return firstEnabled([12, 13, 14, 9, 10, 11, 8, 7, 6, 5, 4, 3, 2, 1, 0], current);
            }
            return current;
          }
        } else {
          // Hire Worker (12)
          if (current === 12) {
            if (key === 'ArrowUp') return firstEnabled([9, 10, 11, 8], current);
            if (key === 'ArrowDown') return 13;
            if (key === 'ArrowLeft') return firstEnabled([5, 4, 7, 6], current);
            if (key === 'ArrowRight') return current;
          }

          // Continue (13)
          if (current === 13) {
            if (key === 'ArrowUp') {
              if (!disabled(12)) return 12;
              if (!disabled(7)) return 7;
              if (!disabled(6)) return 6;
              const powerUpEnabled = firstEnabled([9, 10, 11], -1);
              if (powerUpEnabled !== -1) return powerUpEnabled;
              return firstEnabled([5, 4, 3, 2, 1, 0], current);
            }
            return current;
          }
        }

        return current;
      });
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []); // Empty deps - handler is stable via refs

  const registerRef = useCallback((index: number) => (el: HTMLButtonElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  const getItemProps = useCallback((index: number) => ({
    ref: registerRef(index),
    tabIndex: selectedIndex === index ? 0 : -1,
    onMouseEnter: () => setSelectedIndex(index),
    onClick: () => menuActions[index]?.(),
  }), [selectedIndex, registerRef, menuActions]);

  const selectedRing = "ring-2 ring-white ring-opacity-80";

  // Render stat dots
  const renderStatDots = (level: number) => {
    return (
      <span className="text-[9px] sm:text-xs tracking-wider">
        {Array.from({ length: WORKER_CONFIG.MAX_STAT_LEVEL }, (_, i) => (
          <span key={i} className={i < level ? 'text-purple-600' : 'text-gray-300'}>
            {i < level ? '\u25A0' : '\u25A1'}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-2 sm:p-4 w-full max-w-3xl mx-2 sm:mx-4 relative z-[100] max-h-[95vh] overflow-y-auto">
      {/* Level Complete Banner */}
      {gameState.levelCompleteInfo && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 text-center">
          <h2 className="text-sm sm:text-xl font-bold">Level {gameState.levelCompleteInfo.level} Complete!</h2>
          <div className="flex items-center justify-center space-x-3 sm:space-x-6 text-[10px] sm:text-xs mt-1">
            <span>Served: {gameState.levelCompleteInfo.customersServed}</span>
            <span>Stars Lost: {gameState.levelCompleteInfo.starsLost}</span>
            {gameState.levelCompleteInfo.bossDefeated && <span className="font-bold">Boss Defeated!</span>}
            <span className="font-bold text-yellow-200">+${gameState.levelCompleteInfo.rewards}</span>
          </div>
          {gameState.levelCompleteInfo.starsLost === 0 && (
            <p className="text-[10px] sm:text-xs text-yellow-200 font-bold mt-0.5">Perfect Level!</p>
          )}
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        {/* Left: Store Title + Bank */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Store className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
            <div>
              <h2 className="text-sm sm:text-xl font-bold text-gray-800">Item Store</h2>
              <p className="text-[10px] sm:text-xs text-gray-600">Level {gameState.level}</p>
            </div>
          </div>

          {/* Bank balance */}
          <div className="flex items-center bg-green-100 border border-green-300 rounded-md px-2 sm:px-4 py-1 sm:py-2 shadow-sm">
            <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-700 mr-0.5 sm:mr-1" />
            <span className="text-xs sm:text-lg font-bold text-green-800">
              {gameState.bank}
            </span>
          </div>
        </div>

        {/* Right: Close button */}
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close store"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
        {/* Oven Upgrades */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Oven Upgrades</h3>
          <div className="space-y-1.5 sm:space-y-2">
            {[0, 1, 2, 3].map((lane) => {
              const currentLevel = getOvenUpgradeLevel(lane);
              const currentSpeedLevel = getOvenSpeedUpgradeLevel(lane);
              const isMaxLevel = currentLevel >= maxUpgradeLevel;
              const isMaxSpeedLevel = currentSpeedLevel >= maxSpeedUpgradeLevel;
              const slicesProduced = 1 + currentLevel;

              return (
                <div
                  key={lane}
                  className="border-2 border-orange-200 rounded-lg p-1.5 sm:p-2 bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-between gap-1.5 sm:gap-2"
                >
                  {/* LEFT: Pizza icon and label */}
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    <div className="relative shrink-0 w-6 h-6 sm:w-10 sm:h-10">
                      <PizzaSliceStack sliceCount={slicesProduced} />
                    </div>
                    <div className="leading-tight">
                      <h4 className="text-[11px] sm:text-sm font-bold text-gray-800">Oven {lane + 1}</h4>
                      <p className="text-[9px] sm:text-xs text-gray-600">Lvl: {slicesProduced} | {getSpeedUpgradeText(currentSpeedLevel)}</p>
                    </div>
                  </div>

                  {/* RIGHT: Speed upgrade + Level upgrade buttons */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {/* Speed Upgrade Button */}
                    {isMaxSpeedLevel ? (
                      <div className="bg-gray-200 text-gray-600 rounded py-0.5 px-1 sm:py-1 sm:px-2 text-[9px] sm:text-xs font-semibold whitespace-nowrap">
                        Max⚡
                      </div>
                    ) : (
                      <button
                        {...getItemProps(lane * 2)}
                        disabled={!canAffordSpeedUpgrade(lane)}
                        className={`rounded py-0.5 px-1 sm:py-1 sm:px-2 text-[9px] sm:text-xs font-semibold transition-colors whitespace-nowrap ${
                          canAffordSpeedUpgrade(lane)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        } ${selectedIndex === lane * 2 ? selectedRing : ''}`}
                        title="Upgrade Speed"
                      >
                        ⚡${getLaneSpeedUpgradeCost(lane)}
                      </button>
                    )}

                    {/* Level Upgrade Button */}
                    {isMaxLevel ? (
                      <div className="bg-gray-200 text-gray-600 rounded py-0.5 px-1 sm:py-1 sm:px-2 text-[9px] sm:text-xs font-semibold whitespace-nowrap">
                        Max 🍕
                      </div>
                    ) : (
                      <button
                        {...getItemProps(lane * 2 + 1)}
                        disabled={!canAffordUpgrade(lane)}
                        className={`rounded py-0.5 px-1 sm:py-1 sm:px-2 text-[9px] sm:text-xs font-semibold transition-colors whitespace-nowrap ${
                          canAffordUpgrade(lane)
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        } ${selectedIndex === lane * 2 + 1 ? selectedRing : ''}`}
                        title="Upgrade Level"
                      >
                        🍕 ${getLaneUpgradeCost(lane)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Specials & Power-Ups */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Special Items</h3>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="border-2 border-yellow-300 rounded-lg p-1.5 sm:p-3 bg-gradient-to-br from-yellow-50 to-orange-50">
              <h4 className="text-[10px] sm:text-sm font-bold text-gray-800 mb-0.5 sm:mb-1 text-center">⭐ Bribe Reviewer</h4>
              <p className="text-[9px] sm:text-xs text-gray-600 mb-1 sm:mb-2 text-center">Gain an extra star</p>
              <button
                {...getItemProps(8)}
                disabled={gameState.bank < bribeCost || gameState.lives >= 5}
                className={`w-full rounded py-0.5 px-2 sm:py-1 sm:px-3 text-[10px] sm:text-xs font-semibold transition-colors ${
                  gameState.bank >= bribeCost && gameState.lives < 5
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } ${selectedIndex === 8 ? selectedRing : ''}`}
              >
                ${bribeCost}
              </button>
              {gameState.lives >= 5 && (
                <p className="text-[9px] sm:text-xs text-center mt-0.5 sm:mt-1 text-gray-500">Max stars!</p>
              )}
            </div>

            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mt-1.5 sm:mt-3 mb-1 sm:mb-2">Power-Ups</h3>
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {[
                { type: 'beer', img: beerImg, color: 'amber', index: 9 },
                { type: 'ice-cream', img: sundaeImg, color: 'blue', index: 10 },
                { type: 'honey', img: honeyImg, color: 'orange', index: 11 },
              ].map(({ type, img, color, index }) => (
                <button
                  key={type}
                  {...getItemProps(index)}
                  disabled={gameState.bank < powerUpCost}
                  className={`border-2 rounded-lg p-1 sm:p-2 flex flex-col items-center transition-colors ${
                    gameState.bank >= powerUpCost
                      ? `border-${color}-300 bg-${color}-50 hover:bg-${color}-100`
                      : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                  } ${selectedIndex === index ? selectedRing : ''}`}
                >
                  <img src={img} alt={type} className="w-5 h-5 sm:w-8 sm:h-8 object-contain mb-0.5 sm:mb-1" />
                  <span className="text-[9px] sm:text-xs font-semibold">${powerUpCost}</span>
                </button>
              ))}
            </div>

            {/* Worker Section: Hire or Training Panel */}
            {workerAlreadyHired ? (
              // Training Panel
              <div className="border-2 border-purple-300 rounded-lg p-1.5 sm:p-3 bg-gradient-to-br from-purple-50 to-indigo-50 mt-1.5 sm:mt-2">
                {(() => {
                  const training = gameState.hiredWorker!.training;
                  const rankTitle = getWorkerRankTitle(training);
                  const nextUnlock = getNextUnlock(training);
                  const totalLevel = getTotalTrainingLevel(training);

                  return (
                    <>
                      <div className="text-center mb-1 sm:mb-2">
                        <h4 className="text-[10px] sm:text-sm font-bold text-gray-800">
                          Intern Training - &quot;{rankTitle}&quot;
                        </h4>
                        <p className="text-[8px] sm:text-[10px] text-gray-500">
                          Total Level: {totalLevel}
                        </p>
                      </div>

                      {/* Training stat rows - 2x2 grid */}
                      <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                        {trainingStats.map(({ key, label, index }) => {
                          const currentLevel = training[key] as number;
                          const isMax = currentLevel >= WORKER_CONFIG.MAX_STAT_LEVEL;
                          const cost = getTrainingCost(key, currentLevel);
                          const canAfford = cost !== null && gameState.bank >= cost;

                          return (
                            <div key={key} className="flex items-center justify-between gap-0.5 sm:gap-1">
                              <div className="min-w-0">
                                <span className="text-[9px] sm:text-xs font-semibold text-gray-700">{label}</span>
                                <div>{renderStatDots(currentLevel)}</div>
                              </div>
                              {isMax ? (
                                <div className="bg-gray-200 text-gray-600 rounded py-0.5 px-1 sm:py-1 sm:px-2 text-[9px] sm:text-xs font-semibold whitespace-nowrap">
                                  Max
                                </div>
                              ) : (
                                <button
                                  {...getItemProps(index)}
                                  disabled={!canAfford}
                                  className={`rounded py-0.5 px-1 sm:py-1 sm:px-2 text-[9px] sm:text-xs font-semibold transition-colors whitespace-nowrap ${
                                    canAfford
                                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  } ${selectedIndex === index ? selectedRing : ''}`}
                                >
                                  ${cost}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Next unlock hint */}
                      {nextUnlock && (
                        <p className="text-[8px] sm:text-[10px] text-center mt-1 sm:mt-1.5 text-purple-600 font-semibold">
                          Next: {nextUnlock.name} ({nextUnlock.levelsNeeded} more level{nextUnlock.levelsNeeded > 1 ? 's' : ''})
                        </p>
                      )}
                      {!nextUnlock && (
                        <p className="text-[8px] sm:text-[10px] text-center mt-1 sm:mt-1.5 text-green-600 font-semibold">
                          All abilities unlocked!
                        </p>
                      )}
                      <p className="text-[8px] sm:text-[10px] text-center mt-0.5 text-gray-500">
                        Costs ${COSTS.WORKER_RETENTION}/shop visit
                      </p>
                    </>
                  );
                })()}
              </div>
            ) : (
              // Hire Intern Card
              <div className="border-2 border-purple-300 rounded-lg p-1.5 sm:p-3 bg-gradient-to-br from-purple-50 to-indigo-50 mt-1.5 sm:mt-2">
                <h4 className="text-[10px] sm:text-sm font-bold text-gray-800 mb-0.5 sm:mb-1 text-center">
                  👨‍🍳 Hire Intern
                </h4>
                <p className="text-[9px] sm:text-xs text-gray-600 mb-1 sm:mb-2 text-center">
                  {hasSavedTraining ? 'Re-hire (training preserved!)' : 'Permanent helper chef'}
                </p>
                <button
                  {...getItemProps(12)}
                  disabled={!canAffordWorker}
                  className={`w-full rounded py-0.5 px-2 sm:py-1 sm:px-3 text-[10px] sm:text-xs font-semibold transition-colors ${
                    canAffordWorker
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } ${selectedIndex === 12 ? selectedRing : ''}`}
                >
                  ${hireCost}
                </button>
                <p className="text-[9px] sm:text-xs text-center mt-0.5 sm:mt-1 text-gray-500">
                  Costs ${COSTS.WORKER_RETENTION}/shop visit
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        {...getItemProps(CONTINUE_INDEX)}
        className={`block mx-auto w-half bg-red-600 hover:bg-gray-700 text-white rounded-lg py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm font-semibold transition-colors ${selectedIndex === CONTINUE_INDEX ? selectedRing : ''}`}
      >
        Next Level
      </button>

      {/* Retirement joke overlay */}
      {showRetirementQuip && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-[110]">
          <div className="bg-amber-100 border-4 border-amber-600 rounded-xl px-6 py-4 shadow-2xl animate-bounce">
            <p className="text-lg sm:text-2xl font-bold text-amber-800 text-center">
              Saving for retirement? 🤔
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemStore;
