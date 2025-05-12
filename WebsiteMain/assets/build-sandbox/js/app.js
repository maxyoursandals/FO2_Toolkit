/**
 * Fantasy Online 2 - Build Sandbox Refactored Code
 *
 * This version refactors the original global variable approach
 * into a structured state management pattern using the FO2BuildState object.
 */

// --- Constants ---
const SAVED_BUILDS_KEY = 'fo2BuildTesterBuildsList'; // Key for localStorage list
const MAX_BUILD_DESCRIPTION_LENGTH = 100; // Character limit for build descriptions

// --- DOM Element References (Constants) ---
const levelInput = document.getElementById('level');
const levelSlider = document.getElementById('level-slider');
const rebirthIconClickable = document.getElementById('rebirth-icon-clickable');
const rebirthStatusIcon = document.getElementById('rebirth-status-icon');
const remainingPointsDisplay = document.getElementById('remaining-points');
const resetButton = document.getElementById('reset-button');
const itemSearchModal = document.getElementById('item-search-modal');
const itemSearchInput = document.getElementById('item-search-input');
const searchResults = document.getElementById('search-results');
const cancelSearchButton = document.getElementById('cancel-search');
const notification = document.getElementById('notification');
const hideBossesCheckbox = document.getElementById('hide-bosses-checkbox');
const agiValue = document.getElementById('agi-value');
const strValue = document.getElementById('str-value');
const intValue = document.getElementById('int-value');
const staValue = document.getElementById('sta-value');
const staDisplay = document.getElementById('sta-display');
const strDisplay = document.getElementById('str-display');
const agiDisplay = document.getElementById('agi-display');
const intDisplay = document.getElementById('int-display');
const atkpowerDisplay = document.getElementById('atkpower-display');
const critDisplay = document.getElementById('crit-display');
const dodgeDisplay = document.getElementById('dodge-display');
const armorDisplay = document.getElementById('armor-display');
const atkspeedDisplay = document.getElementById('atkspeed-display');
const damageDisplay = document.getElementById('damage-display');
const energyValue = document.getElementById('energy-value');
const healthValue = document.getElementById('health-value');
const dpsDisplayElement = document.getElementById('dps-display');
const mitigationDisplayElement = document.getElementById('mitigation-display');
const hpRegenDisplayElement = document.getElementById('hp-regen-display');
const energyRegenDisplayElement = document.getElementById('energy-regen-display');
const buildDetailsModal = document.getElementById('build-details-modal');
const modalBuildIdInput = document.getElementById('modal-build-id');
const modalBuildNameInput = document.getElementById('modal-build-name');
const modalBuildCreatorInput = document.getElementById('modal-build-creator');
const modalBuildDescriptionInput = document.getElementById('modal-build-description');
const modalSaveButton = document.getElementById('modal-save-button');
const activeBuffsCountDisplay = document.getElementById('active-buffs-count');
const resetEquipmentButton = document.getElementById('reset-equipment-button');
const resetBuffsBtn = document.getElementById('reset-buffs-button');
const saveBuildBtn = document.getElementById('save-build-button');
const buffGrid = document.getElementById('buff-grid');
const performanceTbody = document.getElementById('performance-tbody');
const minLevelFilterSlider = document.getElementById('mob-level-min-slider');
const maxLevelFilterSlider = document.getElementById('mob-level-max-slider');
const minLevelFilterDisplay = document.getElementById('min-level-display');
const maxLevelFilterDisplay = document.getElementById('max-level-display');
const savedBuildsListContainer = document.getElementById('saved-builds-list');
const itemDictionaryGrid = document.getElementById('item-dictionary-grid');
const itemDictionaryViewer = document.getElementById('item-dictionary-viewer');
const itemDictionarySearchInput = document.getElementById('item-dictionary-search');
const itemDictionaryCategoryFilter = document.getElementById('item-dictionary-category-filter');
const itemDictionarySortCriteria = document.getElementById('item-dictionary-sort-criteria');
const itemDictionarySortOrder = document.getElementById('item-dictionary-sort-order');
const modalCloseBtn = buildDetailsModal ? buildDetailsModal.querySelector('.close-button') : null;
const allEquipmentSlotsElements = document.querySelectorAll('.slot'); // For equipItem UI updates & listeners

// --- Global State Manager Object ---
const FO2BuildState = {
    // --- Game Configuration (Constants) ---
    gameConfig: {
        baseStats: {
            hp: 18, // Base HP per level (approx, adjust if needed)
            energy: 20, // Base Energy per level (approx, adjust if needed)
            atkPower: 40, // Base AP
            atkSpeed: 1400, // Base unarmed attack speed (ms)
            critical: 6.43, // Base critical %
            dodge: 0.00, // Base dodge % (was 5.00, but calculation adds base 0 now)
            armor: 0, // Base armor
            damage: { min: 7, max: 10 } // Base unarmed damage
        },
        maxLevelNormal: 60,
        maxLevelRebirth: 80,
        baseStatPoints: 20, // The base value for stats (AGI, STR, INT, STA)
        initialPoints: 2, // Points at level 1
        pointsPerLevel: 2, // Points gained per level after 1
        rebirthBonusLevelInterval: 4, // Gain 1 point every X levels during rebirth
        bossNames: new Set([ // Moved boss list here
            "Evil McBadguy", "King Crab", "Skele Champion", "Boulder Colorado", "The Alpha",
            "Undead Master Chef", "McBadguy Redux", "Destroyer of Will", "Destroyer of Faith",
            "Destroyer of Mind", "Gamer's Right Hand", "Gamer's Left Hand", "Alrahur",
            "Anubis", "Gamer's Head", "Stuff of Nightmares", "The Badger King", "Bearserker",
            "Rotten Overlord", "Glacier Union Officer", "Devilish Star", "Froctopus",
            "Evil Pie", "The Future", "Evil McFreezeGuy", "Gen. Biodegradable", "The Kraken",
            "Sea Snake", "Chat", "Cat", "Flying Dutchman", "Troglodyte Scourge", "Taunted Throne",
            "The Dark Elf King", "Wild Turkey", "General Turnip", "Ketchup Krusher", "Root Rotter",
            "Gourd Digger", "Carrot Spearman", "Eggsecutioner", "Tater Tyrant"
        ])
    },

    // --- Application Data (Loaded from external sources) ---
    data: {
        // Categorized items { weapon: { subtype: [...] }, equipment: { subtype: [...] } }
        items: {
            weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
            equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
        },
        itemsById: new Map(), // Map<ItemID, ItemObject>
        mobs: [], // Processed array of mob objects { id, name, level, health, xp, avgGoldPerKill, ... }
        mobsMaxLevel: 1, // Highest level found in mobs data
        // Categorized buffs { "Buff": [...], "Morph": [...] }
        buffs: { "Buff": [], "Morph": [] }
    },

    // --- Current Build State ---
    currentBuild: {
        level: 1,
        rebirth: false,
        statPoints: { // Points *allocated* by the player (e.g., 25 means 5 points spent)
            agi: 20,
            str: 20,
            int: 20,
            sta: 20
        },
        pointsRemaining: 2, // Calculated based on level, rebirth, and spent points
        equipment: {}, // Map<SlotName, ItemObject | null>
        activeBuffs: [], // Array of active BuffObjects
        calculatedStats: {} // Store the result of the last calculation { finalStats, finalHP, ..., finalDPS }
    },

    // --- UI State ---
    ui: {
        performance: {
            sortColumn: 'name',
            sortAscending: true,
            minLevel: 1,
            maxLevel: 80, // Will be dynamically adjusted based on mobsMaxLevel
            hideBosses: false
        },
        itemDictionary: {
            search: '',
            category: 'all',
            sortCriteria: 'level',
            sortOrder: 'asc'
        },
        currentItemSearchSlot: null // Track which slot is being edited
    },

    // --- Saved Builds (Loaded/Saved separately to localStorage) ---
    savedBuilds: [], // Array of saved build objects

    // --- State Update Methods ---

    updateLevel(newLevel) {
        newLevel = parseInt(newLevel);
        if (isNaN(newLevel)) newLevel = 1;

        const maxLevel = this.currentBuild.rebirth ?
            this.gameConfig.maxLevelRebirth :
            this.gameConfig.maxLevelNormal;

        newLevel = Math.max(1, Math.min(newLevel, maxLevel)); // Clamp level

        this.currentBuild.level = newLevel;
        this.recalculatePoints(); // Update points remaining

        this.triggerRecalculationAndUpdateUI(); // Recalculate stats & update UI
        return newLevel; // Return the clamped level
    },

    toggleRebirth() {
        this.currentBuild.rebirth = !this.currentBuild.rebirth;

        // Adjust level if it exceeds the new max level
        const maxLevel = this.currentBuild.rebirth ?
            this.gameConfig.maxLevelRebirth :
            this.gameConfig.maxLevelNormal;
        if (this.currentBuild.level > maxLevel) {
            this.currentBuild.level = maxLevel;
        }

        this.recalculatePoints(); // Update points remaining
        this.triggerRecalculationAndUpdateUI(); // Recalculate stats & update UI
        return this.currentBuild.rebirth; // Return the new state
    },

    updateStat(stat, value) {
        value = parseInt(value);
        const base = this.gameConfig.baseStatPoints;
        if (isNaN(value) || value < base) value = base; // Clamp minimum

        const currentValue = this.currentBuild.statPoints[stat];
        const pointDifference = value - currentValue; // How many points the user wants to add/remove

        // Check if adding points exceeds remaining points
        if (pointDifference > 0 && pointDifference > this.currentBuild.pointsRemaining) {
            value = currentValue + this.currentBuild.pointsRemaining; // Limit to available points
        }

        this.currentBuild.statPoints[stat] = value;
        this.recalculatePoints(); // Update points remaining

        this.triggerRecalculationAndUpdateUI(); // Recalculate stats & update UI
        return value; // Return the clamped value
    },

    resetStats() {
        const base = this.gameConfig.baseStatPoints;
        this.currentBuild.statPoints = {
            agi: base,
            str: base,
            int: base,
            sta: base
        };
        this.recalculatePoints();
        this.triggerRecalculationAndUpdateUI();
    },

    // Calculates total points available based on level and rebirth
    calculateAvailablePoints() {
        let points = this.gameConfig.initialPoints; // Base points at level 1
        points += (this.currentBuild.level - 1) * this.gameConfig.pointsPerLevel; // Points per level

        // Rebirth bonus
        if (this.currentBuild.rebirth) {
            points += Math.floor(this.currentBuild.level / this.gameConfig.rebirthBonusLevelInterval);
        }
        return points;
    },

    // Calculates points spent based on stats allocated above base
    calculateUsedPoints() {
        const base = this.gameConfig.baseStatPoints;
        return (
            (this.currentBuild.statPoints.agi - base) +
            (this.currentBuild.statPoints.str - base) +
            (this.currentBuild.statPoints.int - base) +
            (this.currentBuild.statPoints.sta - base)
        );
    },

    // Updates the pointsRemaining property
    recalculatePoints() {
        const available = this.calculateAvailablePoints();
        const used = this.calculateUsedPoints();
        this.currentBuild.pointsRemaining = available - used;
    },

    equipItem(slot, itemObject) {
        this.currentBuild.equipment[slot] = itemObject; // Update state (itemObject can be null to unequip)
        this.triggerRecalculationAndUpdateUI(); // Recalculate & update UI
    },

    resetEquipment() {
        this.currentBuild.equipment = {}; // Clear all equipment
        this.triggerRecalculationAndUpdateUI();
    },

    addBuff(buffObject) {
        if (this.currentBuild.activeBuffs.length < 5 && !this.currentBuild.activeBuffs.some(b => b.Name === buffObject.Name)) {
            this.currentBuild.activeBuffs.push(buffObject);
            this.triggerRecalculationAndUpdateUI();
            return true; // Indicate success
        }
        return false; // Indicate failure (already present or max buffs)
    },

    removeBuff(buffName) {
        const initialLength = this.currentBuild.activeBuffs.length;
        this.currentBuild.activeBuffs = this.currentBuild.activeBuffs.filter(b => b.Name !== buffName);
        if (this.currentBuild.activeBuffs.length < initialLength) {
            this.triggerRecalculationAndUpdateUI();
            return true; // Indicate success
        }
        return false; // Indicate failure (buff not found)
    },

    resetBuffs() {
        this.currentBuild.activeBuffs = [];
        this.triggerRecalculationAndUpdateUI();
    },

    // --- Data Loading Methods ---
    processItemData(itemArray) {
        try {
            if (!itemArray || !Array.isArray(itemArray) || itemArray.length === 0) {
                showNotification("No item data loaded or data is invalid.", "error");
                console.warn("No item data provided to processItemData or data is not an array.");
                // Reset data state
                this.data.items = { weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] }, equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] } };
                this.data.itemsById.clear();
                return false;
            }

            const categorizedItems = {
                weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
                equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
            };
            this.data.itemsById.clear(); // Clear previous map data

            itemArray.forEach(item => {
                // Sanitize and parse numeric fields
                if (item.Level !== undefined) item.Level = parseInt(item.Level) || 0;
                if (item.Armor !== undefined && item.Armor !== "") item.Armor = parseInt(item.Armor) || 0; else item.Armor = 0;
                if (item["Atk Spd"] !== undefined && item["Atk Spd"] !== "") item["Atk Spd"] = parseInt(item["Atk Spd"]) || 0; else item["Atk Spd"] = 0;
                ["STA", "STR", "INT", "AGI", "Req STA", "Req STR", "Req INT", "Req AGI"].forEach(stat => {
                    item[stat] = parseInt(item[stat]) || 0;
                });

                // Process damage string
                const damageValues = processDamageString(item.Damage);
                item.minDamage = damageValues.minDamage;
                item.maxDamage = damageValues.maxDamage;

                // Categorize
                if (item.Type && item.Subtype) {
                    const type = item.Type.toLowerCase();
                    const subtype = item.Subtype.toLowerCase();
                    if (categorizedItems[type] && categorizedItems[type].hasOwnProperty(subtype)) {
                        categorizedItems[type][subtype].push(item);
                    } else {
                        console.warn(`Unknown item type/subtype combination: ${type}/${subtype} for item ${item.Name}`);
                    }
                } else {
                     console.warn(`Item missing Type or Subtype: ${item.Name || item["Item ID"]}`);
                }

                // Populate ID map
                if (item.hasOwnProperty('Item ID') && item['Item ID'] !== undefined) {
                    this.data.itemsById.set(item['Item ID'], item);
                }
            });

            // Sort items within each subtype by level
            for (const type in categorizedItems) {
                for (const subtype in categorizedItems[type]) {
                    categorizedItems[type][subtype].sort((a, b) => (a.Level || 0) - (b.Level || 0));
                }
            }

            this.data.items = categorizedItems; // Assign to state
            console.log(`Item data processed. ${this.data.itemsById.size} items mapped by ID.`);
            showNotification(`Successfully processed ${itemArray.length} items.`, 'success');
            return true;

        } catch (error) {
            console.error("Error processing item data:", error);
            showNotification("Error processing item data. Check console.", "error");
            this.data.items = { weapon: {}, equipment: {} }; // Reset
            this.data.itemsById.clear();
            return false;
        }
    },

    processMobsData(mobsJsonData) {
         try {
            if (!mobsJsonData || !mobsJsonData.mobs || !Array.isArray(mobsJsonData.mobs)) {
                console.error("Invalid mobs data structure:", mobsJsonData);
                showNotification("Error: Invalid mob data format.", "error");
                this.data.mobs = [];
                this.data.mobsMaxLevel = 1;
                return false;
            }

            this.data.mobs = mobsJsonData.mobs.map(mob => {
                const avgGold = ((mob.goldMin || 0) + (mob.goldMax || 0)) / 2;
                let avgItemGold = 0;
                // Calculate average gold from item drops (requires itemsById to be populated)
                if (mob.drops && this.data.itemsById.size > 0) {
                    mob.drops.forEach(drop => {
                        const itemDetails = this.data.itemsById.get(drop.itemId);
                        const sellPrice = itemDetails ? Number(itemDetails.sellPrice) : 0;
                        if (!isNaN(sellPrice) && sellPrice > 0 && drop.dropRate) {
                            avgItemGold += (sellPrice * (Number(drop.dropRate) / 100.0));
                        }
                    });
                }
                const totalAvgGoldPerKill = avgGold + avgItemGold;
                return {
                    id: mob.id,
                    name: mob.name,
                    level: mob.level || 0,
                    health: mob.health || 1,
                    xp: mob.factionXp || 0, // Using factionXp as XP source
                    avgGoldPerKill: totalAvgGoldPerKill,
                    isBoss: this.gameConfig.bossNames.has(mob.name) // Pre-calculate if it's a boss
                };
            });

            // Calculate max mob level from processed data
            if (this.data.mobs.length > 0) {
                this.data.mobsMaxLevel = Math.max(...this.data.mobs.map(m => m.level || 0), 1);
            } else {
                this.data.mobsMaxLevel = 1;
            }
            console.log(`Processed ${this.data.mobs.length} mobs. Max level: ${this.data.mobsMaxLevel}.`);
            return true;

        } catch (error) {
            console.error("Error processing mobs data:", error);
            showNotification("Error processing mob data. Check console.", "error");
            this.data.mobs = [];
            this.data.mobsMaxLevel = 1;
            return false;
        }
    },

    processBuffsData(buffsArray) {
         try {
            if (!buffsArray || !Array.isArray(buffsArray)) {
                console.error("Invalid buffs data provided.");
                this.data.buffs = { "Buff": [], "Morph": [] }; // Reset
                return false;
            }

            // Parse numeric fields for each buff
            buffsArray.forEach(buff => {
                buff["ATK Power"] = parseInt(buff["ATK Power"]) || 0;
                buff["Crit %"] = parseFloat(buff["Crit %"]) || 0;
                buff["ATK Speed"] = parseInt(buff["ATK Speed"]) || 0;
                buff["Energy Per Second"] = parseFloat(buff["Energy Per Second"]) || 0;
                buff["Health Per Second"] = parseFloat(buff["Health Per Second"]) || 0;
                buff["Armor"] = parseInt(buff["Armor"]) || 0;
                buff["STR"] = parseInt(buff["STR"]) || 0;
                buff["STA"] = parseInt(buff["STA"]) || 0;
                buff["AGI"] = parseInt(buff["AGI"]) || 0;
                buff["INT"] = parseInt(buff["INT"]) || 0;
            });

            // Categorize buffs
            this.data.buffs = {
                "Buff": buffsArray.filter(buff => buff.Category === "Buff"),
                "Morph": buffsArray.filter(buff => buff.Category === "Morph")
            };

            console.log("Buffs data processed and categorized.");
            return true;
        } catch (error) {
            console.error("Error processing buffs data:", error);
            showNotification("Error processing buffs data. Check console.", "error");
            this.data.buffs = { "Buff": [], "Morph": [] }; // Reset on error
            return false;
        }
    },

    // --- Stat Calculation Trigger ---
    triggerRecalculationAndUpdateUI() {
        // 1. Recalculate core build stats
        this.currentBuild.calculatedStats = this.performFullStatCalculation();

        // 2. Update main UI display elements
        updateDisplay(this.currentBuild.calculatedStats); // Pass the calculated results

        // 3. Update performance table (uses calculated DPS and UI filters)
        const perfData = this.calculatePerformance();
        updatePerformanceTable(perfData);

        // 4. Save the current state
        this.saveCurrentStateToLocalStorage();
    },

    // --- Unified Stat Calculation Engine ---
    // Calculates stats based *only* on the current state within FO2BuildState
    performFullStatCalculation() {
        const build = this.currentBuild;
        const config = this.gameConfig;
        const base = this.gameConfig.baseStats;

        // 1. Initialize Final Character Stats (AGI, STR, INT, STA)
        const finalCharacterStats = {
            agi: config.baseStatPoints + (build.statPoints.agi - config.baseStatPoints),
            str: config.baseStatPoints + (build.statPoints.str - config.baseStatPoints),
            int: config.baseStatPoints + (build.statPoints.int - config.baseStatPoints),
            sta: config.baseStatPoints + (build.statPoints.sta - config.baseStatPoints)
        };

        // 2. Accumulators for direct bonuses
        let totalDirectArmorBonus = 0;
        let totalDirectAPBonus = 0;
        let totalHPRegenPerSecond = 0;
        let totalEnergyRegenPerSecond = 0;

        // 3. Base weapon characteristics
        let currentWeaponMinDamage = base.damage.min;
        let currentWeaponMaxDamage = base.damage.max;
        let currentBaseAttackSpeed = base.atkSpeed;

        // 4. Process Equipped Items
        for (const slot in build.equipment) {
            const item = build.equipment[slot];
            if (item) {
                finalCharacterStats.agi += item.AGI || 0;
                finalCharacterStats.str += item.STR || 0;
                finalCharacterStats.int += item.INT || 0;
                finalCharacterStats.sta += item.STA || 0;
                totalDirectArmorBonus += item.Armor || 0;

                if (slot === 'weapon' && item.minDamage !== undefined && item.maxDamage !== undefined) {
                    currentWeaponMinDamage = item.minDamage;
                    currentWeaponMaxDamage = item.maxDamage;
                    currentBaseAttackSpeed = item["Atk Spd"] || base.atkSpeed;
                }
            }
        }

        // 5. Process Active Buffs
        let rawBuffCritPercentContribution = 0;
        let atkSpeedBuffApplied = false; // Assuming non-stacking speed buffs for now

        build.activeBuffs.forEach(buff => {
            finalCharacterStats.agi += buff.AGI || 0;
            finalCharacterStats.str += buff.STR || 0;
            finalCharacterStats.int += buff.INT || 0;
            finalCharacterStats.sta += buff.STA || 0;
            totalDirectArmorBonus += buff.Armor || 0;
            totalDirectAPBonus += buff["ATK Power"] || 0;
            rawBuffCritPercentContribution += buff["Crit %"] || 0;
            totalHPRegenPerSecond += Number(buff["Health Per Second"]) || 0;
            totalEnergyRegenPerSecond += Number(buff["Energy Per Second"]) || 0;

            if (buff["ATK Speed"] && !atkSpeedBuffApplied) {
                currentBaseAttackSpeed += parseInt(buff["ATK Speed"]) || 0;
                atkSpeedBuffApplied = true;
            }
        });

        // --- 6. Calculate Final Derived Stats ---

        // HP and Energy (Using constants defined within this method for clarity)
        const baseHpConst = 1080;
        const baseEnergyConst = 1200;
        let finalHP = Math.round(baseHpConst / 60 * build.level);
        let finalEnergy = Math.round(baseEnergyConst / 60 * build.level);
        finalHP += Math.max(0, finalCharacterStats.sta - config.baseStatPoints) * 20;
        finalEnergy += Math.max(0, finalCharacterStats.int - config.baseStatPoints) * 15;

        // Armor
        let finalArmor = Math.max(0, finalCharacterStats.str - config.baseStatPoints) * 5; // Armor from STR
        finalArmor += totalDirectArmorBonus; // Armor from items and buffs
        finalArmor = Math.max(0, finalArmor);

        // Mitigation
        let mitigationPercent = 0;
        const kValue = 200 + 50 * build.level; // Mitigation formula constant
        if ((kValue + finalArmor) > 0) {
            mitigationPercent = (finalArmor / (kValue + finalArmor)) * 100;
        }

        // Attack Speed
        let finalAttackSpeed = Math.max(100, currentBaseAttackSpeed); // Ensure minimum speed

        // Attack Power (AP)
        let finalAP = base.atkPower; // Start with base AP
        let highestStatValue = config.baseStatPoints; // Start comparison from base
        let isStrHighestDriver = false;
        // Find the highest stat value >= base
        if (finalCharacterStats.str >= config.baseStatPoints) { highestStatValue = finalCharacterStats.str; isStrHighestDriver = true; }
        if (finalCharacterStats.agi > highestStatValue) { highestStatValue = finalCharacterStats.agi; isStrHighestDriver = false; }
        if (finalCharacterStats.int > highestStatValue) { highestStatValue = finalCharacterStats.int; isStrHighestDriver = false; }
        if (finalCharacterStats.sta > highestStatValue) { highestStatValue = finalCharacterStats.sta; isStrHighestDriver = false; }
        // STR takes precedence if equal to another highest stat
        if (!isStrHighestDriver && finalCharacterStats.str === highestStatValue && finalCharacterStats.str >= config.baseStatPoints) { isStrHighestDriver = true; }

        let apFromPrimaryStats = 0;
        let apFromSecondaryStr = 0;
        if (highestStatValue >= config.baseStatPoints) { // Only add AP if highest stat is above base
            if (isStrHighestDriver) {
                apFromPrimaryStats = (finalCharacterStats.str - config.baseStatPoints) * 3;
            } else {
                apFromPrimaryStats = (highestStatValue - config.baseStatPoints) * 2;
                if (finalCharacterStats.str > config.baseStatPoints) { // Add secondary STR bonus if STR > base
                    apFromSecondaryStr = (finalCharacterStats.str - config.baseStatPoints) * 1;
                }
            }
        }
        finalAP += Math.max(0, apFromPrimaryStats);
        finalAP += Math.max(0, apFromSecondaryStr);
        finalAP += totalDirectAPBonus; // Add direct AP from buffs
        finalAP = Math.max(0, finalAP); // Ensure AP is not negative

        // Critical Chance
        let critFromStats = calculateCritical(finalCharacterStats, base.critical); // Pass base crit
        let finalCrit = critFromStats;
        // Apply buff crit with diminishing returns
        if (rawBuffCritPercentContribution !== 0) {
            if (finalCrit + rawBuffCritPercentContribution <= 80) {
                finalCrit += rawBuffCritPercentContribution;
            } else if (finalCrit < 80) {
                const fullValue = 80 - finalCrit;
                const reducedValue = (rawBuffCritPercentContribution - fullValue) * 0.5;
                finalCrit = 80 + reducedValue;
            } else { // finalCrit is already >= 80
                finalCrit += rawBuffCritPercentContribution * 0.5;
            }
        }
        finalCrit = Math.max(0, finalCrit);

        // Dodge Chance
        let finalDodge = calculateNewDodge(finalCharacterStats.agi); // Uses base dodge of 0 implicitly
        finalDodge = Math.max(0, finalDodge);

        // Final Min/Max Damage
        const attackSpeedInSeconds = finalAttackSpeed / 1000.0;
        const damageBonusFromAP = Math.floor((finalAP * attackSpeedInSeconds) / 14);
        let finalMinDamage = currentWeaponMinDamage + damageBonusFromAP;
        let finalMaxDamage = currentWeaponMaxDamage + damageBonusFromAP;

        // DPS
        let finalDPS = 0;
        if (finalAttackSpeed > 0) {
            const avgHit = (finalMinDamage + finalMaxDamage) / 2;
            const attacksPerSec = 1000.0 / finalAttackSpeed;
            // Assuming crit adds 100% bonus damage (multiplier = 1 + crit_chance)
            const critMultiplier = 1.0 + (finalCrit / 100.0);
            finalDPS = avgHit * attacksPerSec * critMultiplier;
        }

        // Return the calculated results
        return {
            finalStats: finalCharacterStats, // AGI, STR, INT, STA after all bonuses
            finalHP,
            finalEnergy,
            finalArmor,
            finalAttackSpeed,
            finalAP,
            finalCrit,
            finalDodge,
            finalMinDamage,
            finalMaxDamage,
            finalDPS,
            mitigationPercent,
            finalHPRegenPerSecond: totalHPRegenPerSecond,
            finalEnergyRegenPerSecond: totalEnergyRegenPerSecond
        };
    },

    // Calculates stats for a *saved build object*, resolving IDs/names
    calculateStatsForSavedBuildObject(buildObject) {
        if (!buildObject || !this.data.itemsById || !this.data.buffs) {
            console.error("calculateStatsForSavedBuildObject: Missing build data, item map, or buff data.");
            return null; // Return null or a default structure
        }

        // Resolve item IDs to full item objects
        const resolvedEquipment = {};
        if (buildObject.equipment) {
            for (const slot in buildObject.equipment) {
                const itemId = buildObject.equipment[slot];
                if (itemId !== undefined && itemId !== null) {
                    const item = this.data.itemsById.get(itemId);
                    if (item) {
                        resolvedEquipment[slot] = item;
                    } else {
                        console.warn(`calculateStatsForSavedBuildObject: Item ID ${itemId} for slot ${slot} not found.`);
                    }
                }
            }
        }

        // Resolve buff names to full buff objects
        const resolvedBuffs = [];
        if (buildObject.activeBuffNames) {
            buildObject.activeBuffNames.forEach(buffName => {
                let foundBuff = null;
                for (const category in this.data.buffs) {
                    if(this.data.buffs[category]){
                        foundBuff = this.data.buffs[category].find(b => b.Name === buffName);
                        if (foundBuff) break;
                    }
                }
                if (foundBuff) {
                    resolvedBuffs.push(foundBuff);
                } else {
                    console.warn(`calculateStatsForSavedBuildObject: Buff named "${buffName}" not found.`);
                }
            });
        }

        // Simulate calculation by temporarily overriding parts of the state calculation logic
        // (More complex: might be better to pass params directly to a modified calculation func)
        // Or, create a temporary state object to pass to the existing calculation function.

        // Simpler Approach: Pass necessary data directly to a stateless calculation function
        // (Requires modifying performFullStatCalculation slightly or creating a variant)

        // For now, let's call a conceptual *stateless* version
        // Assume performStatelessCalculation exists and takes all needed parts
        return performStatelessCalculation(
            buildObject.level,
            buildObject.rebirth,
            buildObject.stats, // Allocated points
            resolvedEquipment,
            resolvedBuffs,
            this.gameConfig // Pass game config including base stats
        );
    },

    // Calculates performance against mobs based on current build's DPS and UI filters
    calculatePerformance() {
        const performanceData = [];
        const currentDPS = this.currentBuild.calculatedStats?.finalDPS || 0; // Use calculated DPS
        const filters = this.ui.performance;
        const mobList = this.data.mobs;

        if (!mobList || mobList.length === 0) {
            console.warn("Performance calculation: No mob data available");
            return performanceData;
        }
        if (currentDPS <= 0) {
            // console.warn("Performance calculation: DPS is zero or negative");
            // Don't log warning if DPS is 0, just return empty results
            return performanceData;
        }

        const filteredMobs = mobList.filter(mob => {
            if (!mob || mob.level === undefined || mob.level === null) return false;
            const levelMatch = mob.level >= filters.minLevel && mob.level <= filters.maxLevel;
            const bossMatch = !filters.hideBosses || !mob.isBoss; // Use pre-calculated isBoss flag
            return levelMatch && bossMatch;
        });

        filteredMobs.forEach(mob => {
            if (!mob.health || mob.health <= 0) {
                // console.warn(`Mob "${mob.name}" has invalid health: ${mob.health}`);
                return; // Skip mob
            }

            const timeToKill = mob.health / currentDPS;
            let goldPerHour = 0;
            let xpPerHour = 0;

            if (timeToKill > 0 && isFinite(timeToKill)) {
                const killsPerHour = 3600 / timeToKill;
                goldPerHour = killsPerHour * (mob.avgGoldPerKill || 0);
                xpPerHour = killsPerHour * (mob.xp || 0);
                if (!isFinite(goldPerHour)) goldPerHour = 0;
                if (!isFinite(xpPerHour)) xpPerHour = 0;
            }

            performanceData.push({
                name: mob.name || "Unknown Mob",
                level: mob.level || 0,
                ttk: timeToKill,
                gph: goldPerHour,
                xph: xpPerHour
            });
        });

        return performanceData;
    },

    // --- Persistence Methods ---
    saveCurrentStateToLocalStorage() {
        const saveData = {
            // Only save the parts needed to reconstruct the state
            level: this.currentBuild.level,
            rebirth: this.currentBuild.rebirth,
            stats: this.currentBuild.statPoints,
            equipment: {}, // Store Item IDs
            activeBuffNames: this.currentBuild.activeBuffs.map(buff => buff.Name), // Store Names
            uiPerformance: this.ui.performance // Save UI filters
        };

        // Populate equipment Item IDs
        for (const slot in this.currentBuild.equipment) {
            if (this.currentBuild.equipment[slot]) {
                const itemId = this.currentBuild.equipment[slot]['Item ID'];
                if (itemId !== undefined) {
                    saveData.equipment[slot] = itemId;
                }
            }
        }

        try {
            localStorage.setItem('fo2BuildTesterState', JSON.stringify(saveData));
            // console.log("Current build state saved to localStorage.");
        } catch (e) {
            console.error("Failed to save state:", e);
            showNotification("Could not save current build state.", "error");
        }
    },

    loadCurrentStateFromLocalStorage() {
        const savedDataString = localStorage.getItem('fo2BuildTesterState');
        if (!savedDataString) {
            console.log("No saved build state found in localStorage. Using defaults.");
            // Ensure initial calculation happens even if nothing is loaded
            this.triggerRecalculationAndUpdateUI();
            return false;
        }

        try {
            const savedData = JSON.parse(savedDataString);
            console.log("Loading build state from localStorage:", savedData);

            // Apply saved data to currentBuild
            this.currentBuild.level = savedData.level || 1;
            this.currentBuild.rebirth = savedData.rebirth || false;
            this.currentBuild.statPoints = savedData.stats || { agi: 20, str: 20, int: 20, sta: 20 };

            // Reset equipment & buffs before loading
            this.currentBuild.equipment = {};
            this.currentBuild.activeBuffs = [];

            // Load equipment (requires itemsById map to be ready)
            if (savedData.equipment && this.data.itemsById.size > 0) {
                for (const slot in savedData.equipment) {
                    const itemIdToLoad = savedData.equipment[slot];
                    const itemToEquip = this.data.itemsById.get(itemIdToLoad);
                    if (itemToEquip) {
                        this.currentBuild.equipment[slot] = itemToEquip;
                    } else {
                         console.warn(`Could not find item ID ${itemIdToLoad} for slot ${slot} during load.`);
                    }
                }
            }

            // Load active buffs (requires buffs data to be ready)
            if (savedData.activeBuffNames && (this.data.buffs.Buff.length > 0 || this.data.buffs.Morph.length > 0)) {
                 savedData.activeBuffNames.forEach(buffNameToLoad => {
                    let buffToActivate = null;
                    for (const category in this.data.buffs) {
                        if (Array.isArray(this.data.buffs[category])) {
                            buffToActivate = this.data.buffs[category].find(b => b.Name === buffNameToLoad);
                            if (buffToActivate) break;
                        }
                    }
                    if (buffToActivate) {
                        this.currentBuild.activeBuffs.push(buffToActivate);
                    } else {
                         console.warn(`Buff data missing for ${buffNameToLoad} during load.`);
                    }
                 });
            }

            // Load UI state (performance filters)
            if (savedData.uiPerformance) {
                 Object.assign(this.ui.performance, savedData.uiPerformance);
                 // Clamp loaded levels just in case
                 this.ui.performance.minLevel = parseInt(this.ui.performance.minLevel) || 1;
                 this.ui.performance.maxLevel = parseInt(this.ui.performance.maxLevel) || this.data.mobsMaxLevel;
                 this.ui.performance.minLevel = Math.max(1, Math.min(this.ui.performance.minLevel, this.data.mobsMaxLevel));
                 this.ui.performance.maxLevel = Math.max(this.ui.performance.minLevel, Math.min(this.ui.performance.maxLevel, this.data.mobsMaxLevel));
            }

            console.log("Successfully loaded state from localStorage.");
            this.recalculatePoints(); // Ensure pointsRemaining is correct after loading
            this.triggerRecalculationAndUpdateUI(); // Recalculate stats & update UI
            return true;

        } catch (e) {
            console.error("Failed to load or parse saved state:", e);
            localStorage.removeItem('fo2BuildTesterState'); // Clear potentially corrupted data
            return false;
        }
    },

     // Methods for managing the LIST of saved builds
     loadSavedBuildsList() {
        const buildsString = localStorage.getItem(SAVED_BUILDS_KEY);
        this.savedBuilds = buildsString ? JSON.parse(buildsString) : [];
        console.log(`Loaded ${this.savedBuilds.length} saved builds from list.`);
     },

     saveSavedBuildsList() {
        try {
            localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(this.savedBuilds));
        } catch (e) {
            console.error("Failed to save builds list:", e);
            showNotification("Error saving builds list.", "error");
        }
     },

     addSavedBuild(buildData) {
         // Expects buildData to have id, name, creator, description,
         // level, rebirth, stats, equipment (IDs), activeBuffNames, uiPerformance
         this.savedBuilds.push(buildData);
         this.saveSavedBuildsList();
     },

     updateSavedBuild(buildId, updatedData) {
         const index = this.savedBuilds.findIndex(b => b.id === buildId);
         if (index > -1) {
             // Only update specific fields provided in updatedData (e.g., name, creator, description)
             Object.assign(this.savedBuilds[index], updatedData);
             this.saveSavedBuildsList();
             return true;
         }
         return false;
     },

     deleteSavedBuild(buildId) {
        const index = this.savedBuilds.findIndex(b => b.id === buildId);
        if (index > -1) {
            this.savedBuilds.splice(index, 1);
            this.saveSavedBuildsList();
            return true;
        }
        return false;
     },

     duplicateSavedBuild(buildId) {
         const originalBuild = this.savedBuilds.find(b => b.id === buildId);
         if (originalBuild) {
             const newBuild = JSON.parse(JSON.stringify(originalBuild)); // Deep copy
             newBuild.id = generateBuildId(); // Assign a new unique ID
             newBuild.name = `${originalBuild.name} (Copy)`; // Append "(Copy)"
             const originalIndex = this.savedBuilds.findIndex(b => b.id === buildId);
             this.savedBuilds.splice(originalIndex + 1, 0, newBuild); // Insert copy after original
             this.saveSavedBuildsList();
             return newBuild; // Return the duplicated build
         }
         return null;
     },

     findSavedBuildById(buildId) {
         return this.savedBuilds.find(b => b.id === buildId);
     },

     // Loads a build from the saved list into the currentBuild state
     loadBuildIntoEditor(buildId) {
        const buildToLoad = this.findSavedBuildById(buildId);
        if (!buildToLoad) {
            showNotification("Error: Could not find build to load.", "error");
            return false;
        }

        console.log("Loading build into editor:", buildToLoad.name);

        // Apply saved data to currentBuild
        this.currentBuild.level = buildToLoad.level || 1;
        this.currentBuild.rebirth = buildToLoad.rebirth || false;
        this.currentBuild.statPoints = { ...(buildToLoad.stats || { agi: 20, str: 20, int: 20, sta: 20 }) };

        // Reset equipment & buffs before loading
        this.currentBuild.equipment = {};
        this.currentBuild.activeBuffs = [];

        // Load equipment
        if (buildToLoad.equipment && this.data.itemsById.size > 0) {
            for (const slot in buildToLoad.equipment) {
                const itemIdToLoad = buildToLoad.equipment[slot];
                const itemToEquip = this.data.itemsById.get(itemIdToLoad);
                if (itemToEquip) {
                    this.currentBuild.equipment[slot] = itemToEquip;
                }
            }
        }

        // Load active buffs
        if (buildToLoad.activeBuffNames && (this.data.buffs.Buff.length > 0 || this.data.buffs.Morph.length > 0)) {
             buildToLoad.activeBuffNames.forEach(buffNameToLoad => {
                let buffToActivate = null;
                for (const category in this.data.buffs) {
                    if (Array.isArray(this.data.buffs[category])) {
                        buffToActivate = this.data.buffs[category].find(b => b.Name === buffNameToLoad);
                        if (buffToActivate) break;
                    }
                }
                if (buffToActivate) {
                    this.currentBuild.activeBuffs.push(buffToActivate);
                }
             });
        }

        // Load UI state (performance filters) if saved with the build
        if (buildToLoad.uiPerformance) {
             Object.assign(this.ui.performance, buildToLoad.uiPerformance);
             // Clamp loaded levels
             this.ui.performance.minLevel = parseInt(this.ui.performance.minLevel) || 1;
             this.ui.performance.maxLevel = parseInt(this.ui.performance.maxLevel) || this.data.mobsMaxLevel;
             this.ui.performance.minLevel = Math.max(1, Math.min(this.ui.performance.minLevel, this.data.mobsMaxLevel));
             this.ui.performance.maxLevel = Math.max(this.ui.performance.minLevel, Math.min(this.ui.performance.maxLevel, this.data.mobsMaxLevel));
        }

        this.recalculatePoints(); // Ensure pointsRemaining is correct
        this.triggerRecalculationAndUpdateUI(); // Recalculate and update everything
        updateUIFromState(); // Ensure all UI elements reflect the loaded state

        showNotification(`Loaded build: ${buildToLoad.name}`, 'success');
        return true;
    }

}; // --- End FO2BuildState Object ---


// --- Stateless Calculation Function ---
// Needed for calculating stats of saved builds without modifying the main state
function performStatelessCalculation(level, rebirth, allocatedStatPoints, equippedItems, activeBuffs, gameConfig) {
    // This function should mirror the logic of FO2BuildState.performFullStatCalculation
    // but take all necessary inputs as arguments.
    const base = gameConfig.baseStats;
    const config = gameConfig;

    // 1. Initialize Stats
    const finalCharacterStats = {
        agi: config.baseStatPoints + (allocatedStatPoints.agi - config.baseStatPoints),
        str: config.baseStatPoints + (allocatedStatPoints.str - config.baseStatPoints),
        int: config.baseStatPoints + (allocatedStatPoints.int - config.baseStatPoints),
        sta: config.baseStatPoints + (allocatedStatPoints.sta - config.baseStatPoints)
    };

    // 2. Accumulators
    let totalDirectArmorBonus = 0, totalDirectAPBonus = 0, totalHPRegenPerSecond = 0, totalEnergyRegenPerSecond = 0;

    // 3. Weapon Defaults
    let currentWeaponMinDamage = base.damage.min, currentWeaponMaxDamage = base.damage.max, currentBaseAttackSpeed = base.atkSpeed;

    // 4. Process Items
    for (const slot in equippedItems) {
        const item = equippedItems[slot];
        if (item) {
            finalCharacterStats.agi += item.AGI || 0;
            finalCharacterStats.str += item.STR || 0;
            finalCharacterStats.int += item.INT || 0;
            finalCharacterStats.sta += item.STA || 0;
            totalDirectArmorBonus += item.Armor || 0;
            if (slot === 'weapon' && item.minDamage !== undefined && item.maxDamage !== undefined) {
                currentWeaponMinDamage = item.minDamage;
                currentWeaponMaxDamage = item.maxDamage;
                currentBaseAttackSpeed = item["Atk Spd"] || base.atkSpeed;
            }
        }
    }

    // 5. Process Buffs
    let rawBuffCritPercentContribution = 0, atkSpeedBuffApplied = false;
    activeBuffs.forEach(buff => {
        finalCharacterStats.agi += buff.AGI || 0;
        finalCharacterStats.str += buff.STR || 0;
        finalCharacterStats.int += buff.INT || 0;
        finalCharacterStats.sta += buff.STA || 0;
        totalDirectArmorBonus += buff.Armor || 0;
        totalDirectAPBonus += buff["ATK Power"] || 0;
        rawBuffCritPercentContribution += buff["Crit %"] || 0;
        totalHPRegenPerSecond += Number(buff["Health Per Second"]) || 0;
        totalEnergyRegenPerSecond += Number(buff["Energy Per Second"]) || 0;
        if (buff["ATK Speed"] && !atkSpeedBuffApplied) {
            currentBaseAttackSpeed += parseInt(buff["ATK Speed"]) || 0;
            atkSpeedBuffApplied = true;
        }
    });

    // --- 6. Calculate Derived Stats (mirroring the state method) ---
    const baseHpConst = 1080, baseEnergyConst = 1200;
    let finalHP = Math.round(baseHpConst / 60 * level) + Math.max(0, finalCharacterStats.sta - config.baseStatPoints) * 20;
    let finalEnergy = Math.round(baseEnergyConst / 60 * level) + Math.max(0, finalCharacterStats.int - config.baseStatPoints) * 15;
    let finalArmor = Math.max(0, finalCharacterStats.str - config.baseStatPoints) * 5 + totalDirectArmorBonus;
    finalArmor = Math.max(0, finalArmor);
    let mitigationPercent = 0;
    const kValue = 200 + 50 * level;
    if ((kValue + finalArmor) > 0) mitigationPercent = (finalArmor / (kValue + finalArmor)) * 100;
    let finalAttackSpeed = Math.max(100, currentBaseAttackSpeed);
    let finalAP = base.atkPower;
    let highestStatValue = config.baseStatPoints, isStrHighestDriver = false;
    if (finalCharacterStats.str >= config.baseStatPoints) { highestStatValue = finalCharacterStats.str; isStrHighestDriver = true; }
    if (finalCharacterStats.agi > highestStatValue) { highestStatValue = finalCharacterStats.agi; isStrHighestDriver = false; }
    if (finalCharacterStats.int > highestStatValue) { highestStatValue = finalCharacterStats.int; isStrHighestDriver = false; }
    if (finalCharacterStats.sta > highestStatValue) { highestStatValue = finalCharacterStats.sta; isStrHighestDriver = false; }
    if (!isStrHighestDriver && finalCharacterStats.str === highestStatValue && finalCharacterStats.str >= config.baseStatPoints) isStrHighestDriver = true;
    let apFromPrimaryStats = 0, apFromSecondaryStr = 0;
    if (highestStatValue >= config.baseStatPoints) {
        if (isStrHighestDriver) apFromPrimaryStats = (finalCharacterStats.str - config.baseStatPoints) * 3;
        else {
            apFromPrimaryStats = (highestStatValue - config.baseStatPoints) * 2;
            if (finalCharacterStats.str > config.baseStatPoints) apFromSecondaryStr = (finalCharacterStats.str - config.baseStatPoints) * 1;
        }
    }
    finalAP += Math.max(0, apFromPrimaryStats) + Math.max(0, apFromSecondaryStr) + totalDirectAPBonus;
    finalAP = Math.max(0, finalAP);
    let critFromStats = calculateCritical(finalCharacterStats, base.critical);
    let finalCrit = critFromStats;
    if (rawBuffCritPercentContribution !== 0) {
        if (finalCrit + rawBuffCritPercentContribution <= 80) finalCrit += rawBuffCritPercentContribution;
        else if (finalCrit < 80) finalCrit = 80 + (rawBuffCritPercentContribution - (80 - finalCrit)) * 0.5;
        else finalCrit += rawBuffCritPercentContribution * 0.5;
    }
    finalCrit = Math.max(0, finalCrit);
    let finalDodge = calculateNewDodge(finalCharacterStats.agi);
    finalDodge = Math.max(0, finalDodge);
    const attackSpeedInSeconds = finalAttackSpeed / 1000.0;
    const damageBonusFromAP = Math.floor((finalAP * attackSpeedInSeconds) / 14);
    let finalMinDamage = currentWeaponMinDamage + damageBonusFromAP;
    let finalMaxDamage = currentWeaponMaxDamage + damageBonusFromAP;
    let finalDPS = 0;
    if (finalAttackSpeed > 0) {
        const avgHit = (finalMinDamage + finalMaxDamage) / 2;
        const attacksPerSec = 1000.0 / finalAttackSpeed;
        const critMultiplier = 1.0 + (finalCrit / 100.0);
        finalDPS = avgHit * attacksPerSec * critMultiplier;
    }

    return {
        finalStats: finalCharacterStats, finalHP, finalEnergy, finalArmor, finalAttackSpeed,
        finalAP, finalCrit, finalDodge, finalMinDamage, finalMaxDamage, finalDPS,
        mitigationPercent, finalHPRegenPerSecond: totalHPRegenPerSecond,
        finalEnergyRegenPerSecond: totalEnergyRegenPerSecond
    };
}


// --- Utility Functions ---

/**
 * Displays a notification message.
 * @param {string} message - The message to display.
 * @param {'info' | 'success' | 'error'} type - The type of notification.
 */
function showNotification(message, type = 'info') {
    if (!notification) return;
    notification.textContent = message;
    notification.className = 'notification ' + type;
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 3000);
}

/**
 * Parses a damage string (e.g., "10-20", "5", "1K-2K") into min/max numbers.
 * @param {string|null|undefined} damageString - The damage string to parse.
 * @returns {{minDamage: number, maxDamage: number}}
 */
function processDamageString(damageString) {
    let minDamage = 0, maxDamage = 0;
    if (damageString && typeof damageString === 'string') {
        const kMatch = damageString.match(/(\d+)K-(\d+)K/i);
        const rangeMatch = damageString.match(/(\d+)-(\d+)/);
        const singleMatch = damageString.match(/^(\d+)$/);

        if (kMatch) {
            minDamage = (parseInt(kMatch[1]) || 0) * 1000;
            maxDamage = (parseInt(kMatch[2]) || 0) * 1000;
        } else if (rangeMatch) {
            minDamage = parseInt(rangeMatch[1]) || 0;
            maxDamage = parseInt(rangeMatch[2]) || 0;
        } else if (singleMatch) {
            minDamage = maxDamage = parseInt(singleMatch[1]) || 0;
        }
    }
    return { minDamage, maxDamage };
}

/**
 * Generates a simple unique ID (for saved builds).
 */
function generateBuildId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
* Formats a number with K, M, B suffixes for large values.
* @param {number} num - The number to format.
* @returns {string} The formatted number string.
*/
function formatNumber(num) {
   if (num === null || num === undefined || !isFinite(num)) return "0";
   if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
   if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
   if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
   return Math.round(num).toString();
}

// --- Stat Calculation Helpers (Now Stateless) ---

/**
 * Calculates Dodge % based on Agility using diminishing returns tiers.
 * @param {number} totalAgi - The final Agility value after all bonuses.
 * @returns {number} Calculated Dodge percentage.
 */
function calculateNewDodge(totalAgi) {
    let calculatedDodge = 0;
    const agi = Math.max(0, totalAgi);

    // Tier 1: 1-160 AGI (0.25% per point)
    let pointsInTier1 = Math.min(agi, 160);
    calculatedDodge += pointsInTier1 * 0.25;
    if (agi <= 160) return calculatedDodge;

    // Tier 2: 161-320 AGI (0.125% per point)
    let pointsInTier2 = Math.min(agi - 160, 160);
    calculatedDodge += pointsInTier2 * 0.125;
    if (agi <= 320) return calculatedDodge;

    // Tier 3: 321-640 AGI (0.0625% per point)
    let pointsInTier3 = Math.min(agi - 320, 320);
    calculatedDodge += pointsInTier3 * 0.0625;
    if (agi <= 640) return calculatedDodge;

    // Tier 4: 641+ AGI (0.03125% per point)
    let pointsInTier4 = agi - 640;
    calculatedDodge += pointsInTier4 * 0.03125;

    return calculatedDodge;
}

/**
 * Calculates Critical Hit Chance % based on Agility and Intelligence with diminishing returns.
 * @param {object} finalCharacterStats - Object containing final agi and int values.
 * @param {number} baseCritical - The base critical chance from game config.
 * @returns {number} Calculated Critical Hit Chance percentage.
 */
function calculateCritical(finalCharacterStats, baseCritical) {
    let critical = baseCritical;
    const baseStatValue = 20; // Assuming base stats are 20

    let rawCritAddition = 0;
    if (finalCharacterStats.agi > baseStatValue) {
        rawCritAddition += (finalCharacterStats.agi - baseStatValue) * (1 / 14);
    }
    if (finalCharacterStats.int > baseStatValue) {
        rawCritAddition += (finalCharacterStats.int - baseStatValue) * (1 / 14);
    }

    // Apply diminishing returns above 80%
    if (critical + rawCritAddition <= 80) {
        critical += rawCritAddition;
    } else {
        if (critical < 80) {
            let fullValueAddition = 80 - critical;
            critical = 80;
            let reducedAddition = (rawCritAddition - fullValueAddition) * 0.5;
            critical += reducedAddition;
        } else {
            critical += rawCritAddition * 0.5;
        }
    }
    return critical;
}


// --- UI Update Functions ---

/**
 * Updates all relevant display elements based on the calculated stats.
 * @param {object} results - The calculated stats object from FO2BuildState.performFullStatCalculation.
 */
function updateDisplay(results) {
    if (!results || !results.finalStats) {
        console.warn("updateDisplay called with invalid results:", results);
        // Optionally clear displays or show placeholder text
        return;
    }

    // Base Stats (Final values after bonuses)
    staDisplay.textContent = results.finalStats.sta;
    strDisplay.textContent = results.finalStats.str;
    agiDisplay.textContent = results.finalStats.agi;
    intDisplay.textContent = results.finalStats.int;

    // Derived Stats
    healthValue.textContent = `${results.finalHP}/${results.finalHP}`;
    energyValue.textContent = `${results.finalEnergy}/${results.finalEnergy}`;
    armorDisplay.textContent = results.finalArmor;
    atkspeedDisplay.textContent = (results.finalAttackSpeed / 1000.0).toFixed(1); // Show seconds
    atkpowerDisplay.textContent = results.finalAP;
    critDisplay.textContent = results.finalCrit.toFixed(2) + ' %';
    dodgeDisplay.textContent = results.finalDodge.toFixed(2) + ' %';
    damageDisplay.textContent = `(${results.finalMinDamage}-${results.finalMaxDamage})`;
    if (dpsDisplayElement) dpsDisplayElement.textContent = Math.round(results.finalDPS);
    if (mitigationDisplayElement) mitigationDisplayElement.textContent = results.mitigationPercent.toFixed(2) + ' %';
    if (hpRegenDisplayElement) hpRegenDisplayElement.textContent = results.finalHPRegenPerSecond.toFixed(1);
    if (energyRegenDisplayElement) energyRegenDisplayElement.textContent = results.finalEnergyRegenPerSecond.toFixed(1);

    // Remaining points (Read directly from state as it's calculated separately)
    remainingPointsDisplay.textContent = FO2BuildState.currentBuild.pointsRemaining;
}

/**
 * Updates the UI elements to reflect the current state in FO2BuildState.
 * Called after loading state or when needing a full UI refresh.
 */
function updateUIFromState() {
    const build = FO2BuildState.currentBuild;
    const uiPerf = FO2BuildState.ui.performance;
    const maxLvl = build.rebirth ? FO2BuildState.gameConfig.maxLevelRebirth : FO2BuildState.gameConfig.maxLevelNormal;

    // Level and Rebirth
    levelInput.value = build.level;
    levelSlider.value = build.level;
    levelInput.max = maxLvl;
    levelSlider.max = maxLvl;
    if (rebirthStatusIcon) {
        rebirthStatusIcon.classList.toggle('active', build.rebirth);
    }

    // Stat Inputs
    agiValue.value = build.statPoints.agi;
    strValue.value = build.statPoints.str;
    intValue.value = build.statPoints.int;
    staValue.value = build.statPoints.sta;

    // Equipment Slots
    allEquipmentSlotsElements.forEach(slotElement => {
        if (slotElement.classList.contains('placeholder')) return; // Skip placeholders
        const slotName = slotElement.dataset.slot;
        if (!slotName) return;
        updateSingleSlotUI(slotName, build.equipment[slotName]); // Update based on state
    });

    // Buff Grid
    document.querySelectorAll('.buff-icon').forEach(icon => {
        const buffName = icon.dataset.buffName;
        const isActive = build.activeBuffs.some(b => b.Name === buffName);
        icon.classList.toggle('active', isActive);
    });
    activeBuffsCountDisplay.textContent = `(${build.activeBuffs.length}/5)`;

    // Performance Filters
    if (hideBossesCheckbox) hideBossesCheckbox.checked = uiPerf.hideBosses;
    minLevelFilterSlider.value = uiPerf.minLevel;
    maxLevelFilterSlider.value = uiPerf.maxLevel;
    minLevelFilterDisplay.textContent = uiPerf.minLevel;
    maxLevelFilterDisplay.textContent = uiPerf.maxLevel;

    // Update calculated stats display (using the already calculated stats in state)
    updateDisplay(build.calculatedStats);
}


/**
 * Updates the visual representation of a single equipment slot.
 * @param {string} slotName - The name of the slot (e.g., 'head', 'weapon').
 * @param {object | null} item - The item object equipped in the slot, or null if empty.
 */
function updateSingleSlotUI(slotName, item) {
    const slotElement = document.querySelector(`.slot[data-slot="${slotName}"]`);
    if (!slotElement) return;

    // Clear existing content and clear button
    slotElement.innerHTML = '';
    const existingClearButton = slotElement.querySelector('.clear-slot');
    if (existingClearButton) existingClearButton.remove(); // Should be handled by innerHTML='', but belt-and-suspenders

    if (item) { // Equipping an item
        // Display item image or fallback text
        if (item["Sprite-Link"]) {
            slotElement.innerHTML = `<img src="${item["Sprite-Link"]}" alt="${item.Name || slotName}" title="${item.Name || slotName}" style="image-rendering: pixelated;">`;
        } else {
            slotElement.innerHTML = `<div class="slot-text-fallback" title="${item.Name || ''}">${item.Name ? item.Name.substring(0, 3) : '?'}</div>`;
        }

        // Add clear button
        const clearButton = document.createElement('div');
        clearButton.className = 'clear-slot';
        clearButton.textContent = 'x';
        clearButton.title = 'Remove item';
        clearButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent slot click event
            FO2BuildState.equipItem(slotName, null); // Use state method to unequip
            updateSingleSlotUI(slotName, null); // Update UI immediately
            showNotification(`Removed item from ${slotName}`, 'info');
        });
        slotElement.appendChild(clearButton);

    } else { // Unequipping (item is null)
        // Restore default slot icon
        let iconName = slotName;
        if (slotName === 'ring1' || slotName === 'ring2') iconName = 'ring';
        if (slotName === 'trinket1' || slotName === 'trinket2') iconName = 'trinket';
        const defaultIconSrc = `assets/build-sandbox/icons/${iconName}-icon.png`;
        const defaultAltText = slotName.charAt(0).toUpperCase() + slotName.slice(1);
        slotElement.innerHTML = `<img src="${defaultIconSrc}" alt="${defaultAltText}">`;
        // Add error handling for default icons
        slotElement.querySelector('img').onerror = function() {
             this.parentNode.innerHTML = `<div class="slot-text-fallback">${defaultAltText.substring(0, 3)}</div>`;
        };
    }
}

/**
 * Populates the performance table with calculated data.
 * @param {Array<object>} performanceData - Array of {name, level, ttk, gph, xph} objects.
 */
function updatePerformanceTable(performanceData) {
    if (!performanceTbody) return;
    performanceTbody.innerHTML = ''; // Clear previous rows

    const sortColumn = FO2BuildState.ui.performance.sortColumn;
    const sortAsc = FO2BuildState.ui.performance.sortAscending;

    if (!performanceData || performanceData.length === 0) {
        performanceTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No mobs match criteria or DPS is zero.</td></tr>';
        return;
    }

    // Sort the data based on UI state
    performanceData.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        if (sortColumn === 'name') {
            valA = (valA || '').toLowerCase();
            valB = (valB || '').toLowerCase();
            return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        }
    });

    // Update header sort indicators
    document.querySelectorAll('.performance-table th').forEach(th => {
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) {
            indicator.className = 'sort-indicator'; // Clear previous
            if (th.dataset.sort === sortColumn) {
                indicator.classList.add(sortAsc ? 'asc' : 'desc');
            }
        }
    });

    // Populate table rows
    performanceData.forEach(mobPerf => {
        const row = performanceTbody.insertRow();
        row.insertCell().textContent = mobPerf.name;
        row.insertCell().textContent = mobPerf.level;

        const ttkCell = row.insertCell();
        if (!isFinite(mobPerf.ttk) || mobPerf.ttk <= 0) {
            ttkCell.textContent = "N/A";
            ttkCell.title = "Cannot calculate kill time";
        } else if (mobPerf.ttk > 99) {
            ttkCell.textContent = (mobPerf.ttk / 60).toFixed(1) + 'm';
            ttkCell.title = `${mobPerf.ttk.toFixed(1)} seconds`;
        } else {
            ttkCell.textContent = Math.round(mobPerf.ttk) + 's';
            ttkCell.title = `${mobPerf.ttk.toFixed(1)} seconds`;
        }

        row.insertCell().textContent = formatNumber(mobPerf.gph);
        row.insertCell().textContent = formatNumber(mobPerf.xph);
    });
}

// --- Event Handlers ---

function handleLevelChange() {
    const newLevel = FO2BuildState.updateLevel(levelInput.value);
    // Update UI input/slider in case the level was clamped by the state method
    levelInput.value = newLevel;
    levelSlider.value = newLevel;
}

function handleRebirthChange() {
    const isRebirth = FO2BuildState.toggleRebirth();
    // Update UI based on the new state
    const maxLevel = isRebirth ? FO2BuildState.gameConfig.maxLevelRebirth : FO2BuildState.gameConfig.maxLevelNormal;
    levelInput.max = maxLevel;
    levelSlider.max = maxLevel;
    levelInput.value = FO2BuildState.currentBuild.level; // Ensure input reflects potentially clamped level
    levelSlider.value = FO2BuildState.currentBuild.level;
    if (rebirthStatusIcon) {
        rebirthStatusIcon.classList.toggle('active', isRebirth);
    }
}

function handleStatChange(stat, inputElement) {
    const newValue = FO2BuildState.updateStat(stat, inputElement.value);
    // Update UI input in case the value was clamped
    inputElement.value = newValue;
}

function handleStatButtonClick(stat, action) {
    let currentValue = FO2BuildState.currentBuild.statPoints[stat];
    let newValue = currentValue;
    const base = FO2BuildState.gameConfig.baseStatPoints;

    if (action === 'max' && FO2BuildState.currentBuild.pointsRemaining > 0) {
        newValue += FO2BuildState.currentBuild.pointsRemaining;
    } else if (action === 'min') {
        newValue = base;
    } else if (action === 'reset') {
        newValue = base;
    }

    // Call the main stat change handler with the calculated new value
    const inputElement = document.getElementById(`${stat}-value`);
    inputElement.value = newValue; // Set input value before triggering handleStatChange
    handleStatChange(stat, inputElement);
}

function handleResetStatsClick() {
    FO2BuildState.resetStats();
    // Update UI inputs
    agiValue.value = FO2BuildState.gameConfig.baseStatPoints;
    strValue.value = FO2BuildState.gameConfig.baseStatPoints;
    intValue.value = FO2BuildState.gameConfig.baseStatPoints;
    staValue.value = FO2BuildState.gameConfig.baseStatPoints;
}

function handleToggleBuffClick(buffObject, buffElement) {
    const isActive = buffElement.classList.contains('active');
    let success = false;
    if (isActive) {
        success = FO2BuildState.removeBuff(buffObject.Name);
    } else {
        success = FO2BuildState.addBuff(buffObject);
        if (!success) {
             showNotification("Maximum of 5 buffs allowed or buff already active.", "error");
        }
    }
    // Update UI (icon class and count) if state change was successful
    if(success) {
        buffElement.classList.toggle('active', !isActive);
        activeBuffsCountDisplay.textContent = `(${FO2BuildState.currentBuild.activeBuffs.length}/5)`;
    }
}

function handleResetBuffsClick() {
    FO2BuildState.resetBuffs();
    // Update UI
    document.querySelectorAll('.buff-icon.active').forEach(icon => icon.classList.remove('active'));
    activeBuffsCountDisplay.textContent = `(${FO2BuildState.currentBuild.activeBuffs.length}/5)`;
}

function handleResetEquipmentClick() {
    FO2BuildState.resetEquipment();
    // Update UI for all slots
    allEquipmentSlotsElements.forEach(slotElement => {
        if (!slotElement.classList.contains('placeholder')) {
            const slotName = slotElement.dataset.slot;
            if (slotName) {
                updateSingleSlotUI(slotName, null);
            }
        }
    });
    showNotification('All equipment has been removed.', 'info');
}

function handleFilterSliderChange() {
    let minVal = parseInt(minLevelFilterSlider.value);
    let maxVal = parseInt(maxLevelFilterSlider.value);
    const maxMobLevel = FO2BuildState.data.mobsMaxLevel;

    // Clamp and prevent min > max
    minVal = Math.max(1, Math.min(minVal, maxMobLevel));
    if (minVal > maxVal) minVal = maxVal;
    minLevelFilterSlider.value = minVal;

    maxVal = Math.max(minVal, Math.min(maxVal, maxMobLevel)); // Ensure max >= min
    maxLevelFilterSlider.value = maxVal;

    // Update state
    FO2BuildState.ui.performance.minLevel = minVal;
    FO2BuildState.ui.performance.maxLevel = maxVal;

    // Update displays
    minLevelFilterDisplay.textContent = minVal;
    maxLevelFilterDisplay.textContent = maxVal;

    // Trigger performance recalculation and save state
    const perfData = FO2BuildState.calculatePerformance();
    updatePerformanceTable(perfData);
    FO2BuildState.saveCurrentStateToLocalStorage(); // Save state on slider change
}

function handleHideBossesChange() {
    FO2BuildState.ui.performance.hideBosses = hideBossesCheckbox.checked;
    // Trigger performance recalculation and save state
    const perfData = FO2BuildState.calculatePerformance();
    updatePerformanceTable(perfData);
    FO2BuildState.saveCurrentStateToLocalStorage();
}

function handlePerformanceSortClick(headerElement) {
    const sortKey = headerElement.dataset.sort;
    if (!sortKey) return;

    const currentSort = FO2BuildState.ui.performance.sortColumn;
    const currentAsc = FO2BuildState.ui.performance.sortAscending;

    if (currentSort === sortKey) {
        FO2BuildState.ui.performance.sortAscending = !currentAsc; // Toggle direction
    } else {
        FO2BuildState.ui.performance.sortColumn = sortKey; // Change column
        FO2BuildState.ui.performance.sortAscending = true; // Default to ascending
    }

    // Trigger performance recalculation (which reads state) and update table
    const perfData = FO2BuildState.calculatePerformance();
    updatePerformanceTable(perfData); // updatePerformanceTable reads state for sorting
}

// --- Item Search Functions ---

let currentSearchSlotElement = null; // Store the DOM element being searched for

function openItemSearch(slotElement) {
    const slotName = slotElement.dataset.slot;
    if (!slotName) {
        console.error("Invalid slot element: missing data-slot attribute", slotElement);
        showNotification("Error: Invalid equipment slot", "error");
        return;
    }

    FO2BuildState.ui.currentItemSearchSlot = slotName; // Update state
    currentSearchSlotElement = slotElement; // Keep track of the element for positioning

    // Update Title
    const searchTitle = document.getElementById('search-title');
    if (searchTitle) {
        searchTitle.textContent = `Select for ${slotName.charAt(0).toUpperCase() + slotName.slice(1)}`;
    }

    // Dynamic Positioning
    const slotRect = slotElement.getBoundingClientRect();
    const panelWidth = 350; // Approx width
    const panelHeight = 300; // Approx height
    const margin = 5;

    let potentialTop = slotRect.bottom + margin + window.scrollY;
    let potentialLeft = slotRect.left + window.scrollX;

    if (potentialTop + panelHeight > (window.innerHeight + window.scrollY)) potentialTop = slotRect.top - panelHeight - margin + window.scrollY;
    if (potentialTop < window.scrollY) potentialTop = window.scrollY + margin;
    if (potentialLeft + panelWidth > (window.innerWidth + window.scrollX)) potentialLeft = window.innerWidth + window.scrollX - panelWidth - margin;
    if (potentialLeft < window.scrollX) potentialLeft = window.scrollX + margin;

    itemSearchModal.style.top = `${potentialTop}px`;
    itemSearchModal.style.left = `${potentialLeft}px`;

    itemSearchModal.style.display = 'flex';
    itemSearchInput.value = '';
    itemSearchInput.focus();
    populateSearchResults(); // Initial population
}

function closeItemSearch() {
    itemSearchModal.style.display = 'none';
    itemSearchInput.value = '';
    FO2BuildState.ui.currentItemSearchSlot = null; // Clear state
    currentSearchSlotElement = null;
}

function populateSearchResults(query = '') {
    if (!searchResults) return;
    searchResults.innerHTML = '';

    const currentSlot = FO2BuildState.ui.currentItemSearchSlot;
    if (!currentSlot) return; // Should not happen if modal is open

    const itemsState = FO2BuildState.data.items;
    if (!itemsState) {
        searchResults.innerHTML = '<div class="search-item">Item data not loaded.</div>';
        return;
    }

    // Map slot to item type/subtype
    const slotToTypeMap = { /* ... (same as original) ... */
        head: { type: 'equipment', subtype: 'head' }, face: { type: 'equipment', subtype: 'face' },
        shoulder: { type: 'equipment', subtype: 'shoulder' }, chest: { type: 'equipment', subtype: 'chest' },
        legs: { type: 'equipment', subtype: 'legs' }, back: { type: 'equipment', subtype: 'back' },
        ring1: { type: 'equipment', subtype: 'ring' }, ring2: { type: 'equipment', subtype: 'ring' },
        trinket1: { type: 'equipment', subtype: 'trinket' }, trinket2: { type: 'equipment', subtype: 'trinket' },
        guild: { type: 'equipment', subtype: 'guild' }, faction: { type: 'equipment', subtype: 'faction' },
        offhand: { type: 'equipment', subtype: 'offhand' },
        weapon: { type: 'weapon', subtypes: ['sword', 'bow', 'wand', 'staff', 'hammer', 'axe', 'pickaxe', 'lockpick', '2h sword'] }
    };

    let matchingItems = [];
    const slotMapping = slotToTypeMap[currentSlot];

    if (slotMapping) {
        if (slotMapping.type === 'weapon' && slotMapping.subtypes) {
            slotMapping.subtypes.forEach(subtype => {
                if (itemsState[slotMapping.type]?.[subtype]) {
                    matchingItems = matchingItems.concat(itemsState[slotMapping.type][subtype]);
                }
            });
        } else if (itemsState[slotMapping.type]?.[slotMapping.subtype]) {
            matchingItems = itemsState[slotMapping.type][slotMapping.subtype];
        }
    }

    // Filter by query
    if (query) {
        const lowerQuery = query.toLowerCase();
        matchingItems = matchingItems.filter(item =>
            item.Name.toLowerCase().includes(lowerQuery) ||
            (item.Level && item.Level.toString().includes(lowerQuery))
        );
    }

    matchingItems.sort((a, b) => (a.Level || 0) - (b.Level || 0));

    // Limit results (optional)
    const maxResults = 100;
    if (matchingItems.length > maxResults) {
        const infoElement = document.createElement('div');
        infoElement.className = 'search-info';
        infoElement.textContent = `Showing ${maxResults} of ${matchingItems.length}. Refine search.`;
        searchResults.appendChild(infoElement);
        matchingItems = matchingItems.slice(0, maxResults);
    }

    // Display results
    if (matchingItems.length === 0) {
        searchResults.innerHTML = '<div class="search-item">No matching items found.</div>';
    } else {
        matchingItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'search-item';
            itemElement.textContent = `(Lvl ${item.Level || '?'}) ${item.Name}`;
            // Add simple tooltip on hover for basic info (optional)
            itemElement.title = `AGI:${item.AGI || 0} STR:${item.STR || 0} INT:${item.INT || 0} STA:${item.STA || 0} Armor:${item.Armor || 0}`;

            itemElement.addEventListener('click', () => {
                FO2BuildState.equipItem(currentSlot, item); // Update state
                updateSingleSlotUI(currentSlot, item); // Update UI for this slot
                closeItemSearch();
                showNotification(`Equipped ${item.Name}`, 'success');
            });
            searchResults.appendChild(itemElement);
        });
    }
}


// --- Tooltip Functions ---

// Reusable function to create and position tooltips
function createAndPositionTooltip(element, contentHtml, tooltipId, tooltipClass = 'item-tooltip') {
    hideTooltip(tooltipId); // Remove existing tooltip with the same ID

    const tooltip = document.createElement('div');
    tooltip.className = tooltipClass;
    tooltip.id = tooltipId;
    tooltip.innerHTML = contentHtml;
    document.body.appendChild(tooltip);

    // Position Tooltip
    const elemRect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 10;

    // Default: Right and vertically centered
    let left = elemRect.right + margin;
    let top = elemRect.top + (elemRect.height / 2) - (tooltipRect.height / 2) + window.scrollY;

    // Adjust horizontal position if off-screen
    if (left + tooltipRect.width > (window.innerWidth + window.scrollX - margin)) { // Check right boundary
        left = elemRect.left - tooltipRect.width - margin; // Move to left
        if (left < (window.scrollX + margin)) { // Check left boundary after moving
             left = window.scrollX + margin;
        }
    } else if (left < (window.scrollX + margin)) { // Check left boundary initially
         left = window.scrollX + margin;
    }


    // Adjust vertical position if off-screen
    if (top < (window.scrollY + margin)) { // Check top boundary
        top = window.scrollY + margin;
    } else if (top + tooltipRect.height > (window.innerHeight + window.scrollY - margin)) { // Check bottom boundary
        top = (window.innerHeight + window.scrollY) - tooltipRect.height - margin;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    requestAnimationFrame(() => { tooltip.style.opacity = 1; }); // Fade in
    return tooltip;
}

// Hide a specific tooltip by ID
function hideTooltip(tooltipId = 'item-tooltip') {
    const existingTooltip = document.getElementById(tooltipId);
    if (existingTooltip) {
        existingTooltip.remove();
    }
}

// Show Item Tooltip (for equipped items)
function showItemTooltip(slotElement) {
    const slotName = slotElement.dataset.slot;
    const item = FO2BuildState.currentBuild.equipment[slotName];
    if (!item) return;

    // Build tooltip content (reusing logic from original, but now stateless)
    let content = `<div class="tooltip-title">${item.Name}</div>`;
    // ... (rest of the content building logic: Level, Stats, Requirements - same as original) ...
     if (item.Level !== undefined) content += `<div class="tooltip-level">Level ${item.Level}${item.Subtype ? ` ${item.Subtype}` : ''}</div>`;
     const statsHtml = [];
     ['STA', 'STR', 'INT', 'AGI', 'Armor'].forEach(k => { if (item[k]) statsHtml.push(`<div class="${item[k] > 0 ? 'stat-positive' : 'stat-negative'}">${k}: ${item[k] > 0 ? '+' : ''}${item[k]}</div>`); });
     if (item.Damage) statsHtml.push(`<div>Damage: ${item.Damage}</div>`);
     if (item['Atk Spd']) statsHtml.push(`<div>Speed: ${item['Atk Spd']}</div>`);
     if (statsHtml.length > 0) content += `<div class="tooltip-stats">${statsHtml.join('')}</div>`;
     const reqHtml = [];
     ['Req STA', 'Req STR', 'Req INT', 'Req AGI'].forEach(k => { if (item[k]) reqHtml.push(`<div>Requires ${k.replace('Req ', '')}: ${item[k]}</div>`); });
     if (reqHtml.length > 0) {
         if (statsHtml.length > 0) content += `<div class="tooltip-separator"></div>`;
         content += `<div class="tooltip-req">${reqHtml.join('')}</div>`;
     }

    createAndPositionTooltip(slotElement, content, 'item-tooltip');
}

// Show Buff Tooltip
function showBuffTooltip(buff, element) {
     if (!buff) return;
    // Build content
    let content = `<div class="tooltip-title">${buff.Name} (${buff.Category})</div>`;
    const effects = [];
    const addEffect = (label, value, unit = "") => {
        if (value !== undefined && value !== null && value !== 0 && value !== "") {
            const sign = value > 0 ? '+' : '';
            const cssClass = (label === "ATK Speed" ? (value < 0 ? 'effect-positive' : 'effect-negative') : (value > 0 ? 'effect-positive' : 'effect-negative'));
            effects.push(`<div class="buff-effect ${cssClass}">${label}: ${sign}${value}${unit}</div>`);
        }
    };
     const statMappings = [ /* ... same as original ... */
         { key: "ATK Power", label: "ATK Power" }, { key: "Crit %", label: "Crit", unit: "%" },
         { key: "ATK Speed", label: "ATK Speed" }, { key: "Energy Per Second", label: "Energy Per Sec" },
         { key: "Health Per Second", label: "Health Per Sec" }, { key: "Armor", label: "Armor" },
         { key: "STR", label: "STR" }, { key: "STA", label: "STA" }, { key: "AGI", label: "AGI" }, { key: "INT", label: "INT" }
     ];
    statMappings.forEach(m => addEffect(m.label, buff[m.key], m.unit));
    content += effects.join('');

    createAndPositionTooltip(element, content, 'buff-tooltip', 'buff-tooltip');
}

// Show Grid Item Tooltip (for item dictionary)
function showGridItemTooltip(element, item) {
    if (!item) return;
    // Build tooltip content (same as showItemTooltip's content building)
    let content = `<div class="tooltip-title">${item.Name}</div>`;
     // ... (rest of the content building logic: Level, Stats, Requirements - same as showItemTooltip) ...
      if (item.Level !== undefined) content += `<div class="tooltip-level">Level ${item.Level}${item.Subtype ? ` ${item.Subtype}` : ''}</div>`;
      const statsHtml = [];
      ['STA', 'STR', 'INT', 'AGI', 'Armor'].forEach(k => { if (item[k]) statsHtml.push(`<div class="${item[k] > 0 ? 'stat-positive' : 'stat-negative'}">${k}: ${item[k] > 0 ? '+' : ''}${item[k]}</div>`); });
      if (item.Damage) statsHtml.push(`<div>Damage: ${item.Damage}</div>`);
      if (item['Atk Spd']) statsHtml.push(`<div>Speed: ${item['Atk Spd']}</div>`);
      if (statsHtml.length > 0) content += `<div class="tooltip-stats">${statsHtml.join('')}</div>`;
      const reqHtml = [];
      ['Req STA', 'Req STR', 'Req INT', 'Req AGI'].forEach(k => { if (item[k]) reqHtml.push(`<div>Requires ${k.replace('Req ', '')}: ${item[k]}</div>`); });
      if (reqHtml.length > 0) {
          if (statsHtml.length > 0) content += `<div class="tooltip-separator"></div>`;
          content += `<div class="tooltip-req">${reqHtml.join('')}</div>`;
      }

    createAndPositionTooltip(element, content, 'item-tooltip'); // Reuses item-tooltip ID and class
}


// --- Initialization ---

/**
 * Main initialization logic, run after the DOM is fully loaded.
 */
async function initializeApplication() {
    console.log("DOM Loaded. Starting initialization...");
    showNotification("Loading game data...", "info");

    try {
        // --- 1. Fetch all external JSON data ---
        console.log("Fetching data...");
        const [itemsResponse, mobsResponse, buffsResponse] = await Promise.all([
            fetch('assets/build-sandbox/data/items.json').catch(e => { console.error("Fetch items failed:", e); return { ok: false, json: () => null }; }),
            fetch('assets/build-sandbox/data/mobs.json').catch(e => { console.error("Fetch mobs failed:", e); return { ok: false, json: () => null }; }),
            fetch('assets/build-sandbox/data/buffs.json').catch(e => { console.error("Fetch buffs failed:", e); return { ok: false, json: () => null }; })
        ]);

        if (!itemsResponse.ok || !mobsResponse.ok || !buffsResponse.ok) {
             throw new Error("One or more data files failed to load. Check fetch paths and network.");
        }

        const rawItemsArray = await itemsResponse.json();
        const rawMobsData = await mobsResponse.json();
        const rawBuffsArray = await buffsResponse.json();

        if (rawItemsArray === null || rawMobsData === null || rawBuffsArray === null) {
            throw new Error("One or more data files parsed to null.");
        }
        console.log("Data fetched successfully.");

        // --- 2. Process data and populate state (Order Matters!) ---
        console.log("Processing item data...");
        if (!FO2BuildState.processItemData(rawItemsArray)) throw new Error("Failed to process item data.");

        console.log("Processing buff data...");
        if (!FO2BuildState.processBuffsData(rawBuffsArray)) throw new Error("Failed to process buff data.");

        console.log("Processing mob data...");
        if (!FO2BuildState.processMobsData(rawMobsData)) throw new Error("Failed to process mob data.");


        // --- 3. Load Saved State / Initialize UI ---
        console.log("Loading saved state...");
        FO2BuildState.loadCurrentStateFromLocalStorage(); // Load current build state
        FO2BuildState.loadSavedBuildsList(); // Load the list of saved builds

        console.log("Initializing UI components...");
        initializeBuffGrid(); // Needs buffsData
        displaySavedBuilds(); // Needs savedBuilds list, itemsById, buffsData
        setupLevelFilterSliders(); // Needs mobsMaxLevel and loaded filter state
        populateItemCategoryFilter(); // Needs item data
        setupItemDictionaryControls(); // Setup listeners for item dictionary filters

        // --- 4. Final UI Update based on loaded state ---
        console.log("Updating UI from loaded state...");
        updateUIFromState(); // Reflects loaded state in all UI elements

        // --- 5. Setup Event Listeners ---
        console.log("Setting up event listeners...");
        setupNavigation();
        setupEventListeners();
        addPerformanceTableSortListeners();

        showNotification("Application loaded successfully!", "success");
        console.log("Application initialized successfully.");

    } catch (error) {
        console.error("CRITICAL INITIALIZATION ERROR:", error);
        showNotification(`Failed to initialize application: ${error.message}. Check console.`, "error");
        const appContainer = document.getElementById('app-container'); // Assuming you have a main container
        if (appContainer) {
            appContainer.innerHTML = `<div class="init-error">
                <h2>Application Failed to Load</h2>
                <p>Error: ${error.message}</p>
                <p>Please check the browser console (F12) for details.</p>
            </div>`;
        }
    } finally {
        console.log("Initialization process finished.");
        // Hide loading spinner if you have one
    }
}

document.addEventListener('DOMContentLoaded', initializeApplication);


// --- UI Setup Functions ---

function initializeBuffGrid() {
    if (!buffGrid) return;
    buffGrid.innerHTML = '';
    const buffsState = FO2BuildState.data.buffs;

    Object.keys(buffsState).forEach(category => {
        buffsState[category].forEach(buff => {
            createBuffIcon(buff); // Pass buff object
        });
    });
}

function createBuffIcon(buff) {
    const buffDiv = document.createElement('div');
    buffDiv.className = 'buff-icon';
    buffDiv.dataset.buffName = buff.Name;
    buffDiv.dataset.category = buff.Category;

    const tierMatch = buff.Name.match(/\s(\d+)$/);
    const tier = tierMatch ? tierMatch[1] : null;
    let baseName = buff.Name.toLowerCase().replace(/\s+\d+$/, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const iconFileName = `assets/build-sandbox/icons/${baseName}-icon.png`;

    const imgElement = document.createElement('img');
    imgElement.src = iconFileName;
    imgElement.alt = buff.Name;
    imgElement.onerror = function() { /* Handle image load error if needed */ console.warn(`Buff icon not found: ${iconFileName}`); };
    buffDiv.appendChild(imgElement);

    if (tier) {
        const tierSpan = document.createElement('span');
        tierSpan.className = 'buff-tier';
        tierSpan.textContent = tier;
        buffDiv.appendChild(tierSpan);
    }

    // Use event delegation if possible, otherwise add listeners here
    buffDiv.addEventListener('click', () => handleToggleBuffClick(buff, buffDiv));
    buffDiv.addEventListener('mouseenter', (e) => showBuffTooltip(buff, e.target));
    buffDiv.addEventListener('mouseleave', () => hideTooltip('buff-tooltip'));

    if (buffGrid) buffGrid.appendChild(buffDiv);
}

function setupLevelFilterSliders() {
    if (!minLevelFilterSlider || !maxLevelFilterSlider || !minLevelFilterDisplay || !maxLevelFilterDisplay) return;

    const maxLevel = FO2BuildState.data.mobsMaxLevel;
    minLevelFilterSlider.max = maxLevel;
    maxLevelFilterSlider.max = maxLevel;

    // Set initial values from state (already loaded and clamped)
    minLevelFilterSlider.value = FO2BuildState.ui.performance.minLevel;
    maxLevelFilterSlider.value = FO2BuildState.ui.performance.maxLevel;
    minLevelFilterDisplay.textContent = FO2BuildState.ui.performance.minLevel;
    maxLevelFilterDisplay.textContent = FO2BuildState.ui.performance.maxLevel;

    // Listeners already set up in setupEventListeners
}

function addPerformanceTableSortListeners() {
    document.querySelectorAll('.performance-table th[data-sort]').forEach(header => {
        header.addEventListener('click', () => handlePerformanceSortClick(header));
    });
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.top-nav .nav-button');
    const pages = document.querySelectorAll('.page-content .page');

    if (!navButtons.length || !pages.length) {
        console.error("[Nav] Navigation buttons or page elements not found.");
        return;
    }

    let dictionaryLoaded = false; // Track if dictionary content needs loading

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPageKey = button.dataset.page;
            const targetPageId = `${targetPageKey}-page`;
            console.log(`[Nav] Navigating to: ${targetPageId}`);

            // Update button active state
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update page visibility
            let foundPage = false;
            pages.forEach(page => {
                const isActive = page.id === targetPageId;
                page.classList.toggle('active', isActive);
                if (isActive) foundPage = true;
            });

            if (!foundPage) {
                console.error(`[Nav] Target page '${targetPageId}' not found!`);
                return;
            }

            // Page-specific actions
            if (targetPageKey === 'build-management') {
                displaySavedBuilds(); // Refresh saved builds list
            }
            if (targetPageKey === 'item-dictionary') {
                if (!dictionaryLoaded) {
                    populateItemDictionaryGrid(); // Populate grid on first view
                    dictionaryLoaded = true;
                }
            }
        });
    });

    // Set initial active state based on HTML
    const initialActivePage = document.querySelector('.page-content .page.active');
    if (initialActivePage) {
        const initialPageKey = initialActivePage.id.replace('-page', '');
        const initialActiveButton = document.querySelector(`.top-nav .nav-button[data-page="${initialPageKey}"]`);
        if (initialActiveButton && !initialActiveButton.classList.contains('active')) {
            navButtons.forEach(btn => btn.classList.remove('active'));
            initialActiveButton.classList.add('active');
        }
        // Initial population if dictionary is the starting page
        if (initialPageKey === 'item-dictionary' && !dictionaryLoaded) {
            populateItemDictionaryGrid();
            dictionaryLoaded = true;
        }
    } else if (navButtons.length > 0) {
        // Default to first page if none are active in HTML
        navButtons[0].click();
    }
}

// Setup all event listeners (called once during initialization)
function setupEventListeners() {
    // Level Input/Slider
    levelInput.addEventListener('change', handleLevelChange);
    levelSlider.addEventListener('input', () => {
        levelInput.value = levelSlider.value; // Sync input first
        handleLevelChange(); // Then handle change
    });

    // Rebirth Icon
    if (rebirthIconClickable) rebirthIconClickable.addEventListener('click', handleRebirthChange);

    // Stat Inputs
    agiValue.addEventListener('change', () => handleStatChange('agi', agiValue));
    strValue.addEventListener('change', () => handleStatChange('str', strValue));
    intValue.addEventListener('change', () => handleStatChange('int', intValue));
    staValue.addEventListener('change', () => handleStatChange('sta', staValue));

    // Stat Buttons
    document.querySelectorAll('.stat-button').forEach(button => {
        button.addEventListener('click', function() {
            const stat = this.dataset.stat;
            const action = this.classList.contains('increase') ? 'max' : 'min'; // Only max/min actions?
            handleStatButtonClick(stat, action);
        });
    });

    // Reset Stats Button
    if (resetButton) resetButton.addEventListener('click', handleResetStatsClick);

    // Reset Buffs Button
    if (resetBuffsBtn) resetBuffsBtn.addEventListener('click', handleResetBuffsClick);

    // Reset Equipment Button
    if (resetEquipmentButton) resetEquipmentButton.addEventListener('click', handleResetEquipmentClick);

    // Equipment Slots (Click to open search, hover for tooltip)
    allEquipmentSlotsElements.forEach(slot => {
        if (slot.classList.contains('placeholder')) return;
        const slotName = slot.dataset.slot;
        if (!slotName) return;
        slot.addEventListener('click', (event) => {
            // Prevent opening search if clear button was clicked
            if (event.target.classList && event.target.classList.contains('clear-slot')) return;
            openItemSearch(slot); // Pass the element itself
        });
        slot.addEventListener('mouseenter', () => showItemTooltip(slot));
        slot.addEventListener('mouseleave', () => hideTooltip('item-tooltip'));
    });

    // Item Search Modal
    itemSearchInput.addEventListener('input', () => populateSearchResults(itemSearchInput.value));
    if (cancelSearchButton) cancelSearchButton.addEventListener('click', closeItemSearch);

    // Performance Filters
    if (hideBossesCheckbox) hideBossesCheckbox.addEventListener('change', handleHideBossesChange);
    minLevelFilterSlider.addEventListener('input', handleFilterSliderChange);
    maxLevelFilterSlider.addEventListener('input', handleFilterSliderChange);

    // Save Current Build Button (opens modal)
    if (saveBuildBtn) saveBuildBtn.addEventListener('click', handleSaveCurrentBuildClick);

    // Build Details Modal
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeBuildModal);
    if (buildDetailsModal) {
         buildDetailsModal.addEventListener('click', function(event) { // Close on outside click
             if (event.target === buildDetailsModal) closeBuildModal();
         });
        // Save button listener is attached dynamically in openBuildModal
    }
}

function setupItemDictionaryControls() {
    if (itemDictionarySearchInput) itemDictionarySearchInput.addEventListener('input', handleItemDictionaryFilterChange);
    if (itemDictionaryCategoryFilter) itemDictionaryCategoryFilter.addEventListener('change', handleItemDictionaryFilterChange);
    if (itemDictionarySortCriteria) itemDictionarySortCriteria.addEventListener('change', handleItemDictionaryFilterChange);
    if (itemDictionarySortOrder) itemDictionarySortOrder.addEventListener('change', handleItemDictionaryFilterChange);
}

function handleItemDictionaryFilterChange() {
     // Update state from UI controls
     FO2BuildState.ui.itemDictionary.search = itemDictionarySearchInput.value.toLowerCase();
     FO2BuildState.ui.itemDictionary.category = itemDictionaryCategoryFilter.value;
     FO2BuildState.ui.itemDictionary.sortCriteria = itemDictionarySortCriteria.value;
     FO2BuildState.ui.itemDictionary.sortOrder = itemDictionarySortOrder.value;
     // Repopulate grid based on new state
     populateItemDictionaryGrid();
}

// --- Item Dictionary UI ---

function populateItemDictionaryGrid() {
    if (!itemDictionaryGrid) return;
    itemDictionaryGrid.innerHTML = ''; // Clear

    if (!FO2BuildState.data.itemsById || FO2BuildState.data.itemsById.size === 0) {
        itemDictionaryGrid.innerHTML = '<p class="empty-message">No item data loaded.</p>';
        return;
    }

    const filters = FO2BuildState.ui.itemDictionary;
    let filteredItems = Array.from(FO2BuildState.data.itemsById.values());

    // Filter by Search Term
    if (filters.search) {
        filteredItems = filteredItems.filter(item => item.Name?.toLowerCase().includes(filters.search));
    }

    // Filter by Category
    if (filters.category !== 'all') {
        const [typeFilter, subtypeFilter] = filters.category.split('-');
        filteredItems = filteredItems.filter(item => {
            const itemType = item.Type?.toLowerCase();
            const itemSubtype = item.Subtype?.toLowerCase().replace(/\s+/g, '_'); // Normalize subtype
            if (itemType !== typeFilter) return false;
            if (subtypeFilter !== 'all' && itemSubtype !== subtypeFilter) return false;
            return true;
        });
    }

    // Sort Items
    filteredItems.sort((a, b) => {
        let valA, valB;
        switch (filters.sortCriteria) {
            case 'name':
                valA = a.Name?.toLowerCase() || ''; valB = b.Name?.toLowerCase() || '';
                return filters.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            case 'level': default:
                valA = a.Level || 0; valB = b.Level || 0;
                return filters.sortOrder === 'asc' ? valA - valB : valB - valA;
        }
    });

    // Render Grid Items - MODIFIED TO ENSURE SINGLE CONTINUOUS GRID
    if (filteredItems.length === 0) {
        itemDictionaryGrid.innerHTML = '<p class="empty-message">No items match criteria.</p>';
    } else {
        // Create a single container for all items - no separate rows or groups
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-items-container'; // Optional: for additional styling
        
        filteredItems.forEach(item => {
            const iconDiv = document.createElement('div');
            iconDiv.className = 'grid-item-icon';
            iconDiv.dataset.itemId = item['Item ID'];
            if (item['Sprite-Link']) {
                iconDiv.innerHTML = `<img src="${item['Sprite-Link']}" alt="${item.Name}" style="image-rendering: pixelated;">`;
                iconDiv.querySelector('img').onerror = () => { iconDiv.innerHTML = '?'; iconDiv.title = `${item.Name} (Image Error)`; };
            } else {
                iconDiv.innerHTML = '?'; iconDiv.title = item.Name;
            }
            iconDiv.addEventListener('mouseenter', (e) => showGridItemTooltip(e.currentTarget, item));
            iconDiv.addEventListener('mouseleave', () => hideTooltip('item-tooltip'));
            iconDiv.addEventListener('click', () => displayItemInViewer(item));
            
            // Add directly to the grid instead of any sub-grouping
            itemDictionaryGrid.appendChild(iconDiv);
        });
    }
}

function displayItemInViewer(item) {
    if (!itemDictionaryViewer) return;
    itemDictionaryViewer.innerHTML = ''; // Clear

    if (!item) {
        itemDictionaryViewer.innerHTML = '<p class="empty-message">Select an item.</p>';
        return;
    }

    // Build HTML (similar to original, ensures all fields are checked)
    let content = '';
    if (item['Sprite-Link']) content += `<div class="viewer-image"><img src="${item['Sprite-Link']}" alt="${item.Name}" style="image-rendering: pixelated;"></div>`;
    content += `<h4 class="viewer-title">${item.Name}</h4>`;
    content += `<div class="viewer-level-type">Level ${item.Level || 0} - ${item.Type || ''}${item.Subtype ? ` / ${item.Subtype}` : ''}</div>`;

    const statsHtml = [];
     const statMappings = [ /* ... same mappings as before ... */
         { key: 'STA', label: 'STA', classPositive: 'stat-positive', classNegative: 'stat-negative' },
         { key: 'STR', label: 'STR', classPositive: 'stat-positive', classNegative: 'stat-negative' },
         { key: 'INT', label: 'INT', classPositive: 'stat-positive', classNegative: 'stat-negative' },
         { key: 'AGI', label: 'AGI', classPositive: 'stat-positive', classNegative: 'stat-negative' },
         { key: 'Armor', label: 'Armor', classPositive: 'stat-positive', classNegative: 'stat-negative' },
         { key: 'Damage', label: 'Damage', classPositive: '', classNegative: '' },
         { key: 'Atk Spd', label: 'Speed (ms)', classPositive: '', classNegative: '' }
     ];
     statMappings.forEach(m => {
         if (item.hasOwnProperty(m.key) && item[m.key] !== undefined && item[m.key] !== '' && item[m.key] !== 0) {
             const v = item[m.key]; let dv = v; let c = '';
             if (typeof v === 'number') { c = v > 0 ? m.classPositive : m.classNegative; dv = `${v > 0 ? '+' : ''}${v}`; }
             statsHtml.push(`<div class="viewer-stat-line"><span class="viewer-stat-label">${m.label}:</span> <span class="${c}">${dv}</span></div>`);
         }
     });
    if (statsHtml.length > 0) content += `<h5>Stats</h5><div class="viewer-stats">${statsHtml.join('')}</div>`;

    const reqHtml = [];
    ['Req STA', 'Req STR', 'Req INT', 'Req AGI'].forEach(k => {
        if (item.hasOwnProperty(k) && item[k] !== undefined && item[k] !== 0 && item[k] !== '') {
             reqHtml.push(`<div class="viewer-req-line">Requires ${k.replace('Req ', '')}: ${item[k]}</div>`);
        }
    });
    if (reqHtml.length > 0) content += `<h5>Requirements</h5><div class="viewer-reqs">${reqHtml.join('')}</div>`;

    itemDictionaryViewer.innerHTML = content;
}

function populateItemCategoryFilter() {
    if (!itemDictionaryCategoryFilter || !FO2BuildState.data.itemsById || FO2BuildState.data.itemsById.size === 0) return;

    const categoriesMap = new Map(); // Map<Type, Set<Subtype>>
    FO2BuildState.data.itemsById.forEach(item => {
        const type = item.Type?.trim();
        const subtype = item.Subtype?.trim();
        if (type) {
            if (!categoriesMap.has(type)) categoriesMap.set(type, new Set());
            if (subtype) categoriesMap.get(type).add(subtype);
        }
    });

    // Clear existing options (keep "All Categories")
    while (itemDictionaryCategoryFilter.options.length > 1) itemDictionaryCategoryFilter.remove(1);

    const sortedTypes = Array.from(categoriesMap.keys()).sort();
    sortedTypes.forEach(typeName => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = typeName.charAt(0).toUpperCase() + typeName.slice(1);
        itemDictionaryCategoryFilter.appendChild(optgroup);

        // "All [Type]" option
        const allOfTypeOption = document.createElement('option');
        allOfTypeOption.value = `${typeName.toLowerCase()}-all`;
        allOfTypeOption.textContent = `All ${optgroup.label}`; // Use capitalized label
        optgroup.appendChild(allOfTypeOption);

        // Subtype options
        const subtypes = Array.from(categoriesMap.get(typeName) || []).sort();
        subtypes.forEach(subtypeName => {
            const option = document.createElement('option');
            const normalizedSubtypeName = subtypeName.toLowerCase().replace(/\s+/g, '_');
            option.value = `${typeName.toLowerCase()}-${normalizedSubtypeName}`;
            option.textContent = `  ${subtypeName.charAt(0).toUpperCase() + subtypeName.slice(1)}`;
            optgroup.appendChild(option);
        });
    });
}


// --- Saved Builds Management UI ---

function displaySavedBuilds() {
    if (!savedBuildsListContainer) return;
    savedBuildsListContainer.innerHTML = ''; // Clear

    const builds = FO2BuildState.savedBuilds;

    if (!builds || builds.length === 0) {
        savedBuildsListContainer.innerHTML = '<div class="empty-message">No saved builds.</div>';
        return;
    }

    const allEquipmentSlotsLayout = [ /* ... same layout as original ... */
         'face',    'head',     'shoulder', 'back',   'legs',    'chest',    'weapon',   'offhand',
         'ring1',   'ring2',    'trinket1', 'trinket2', 'guild',   'faction',  '',         ''
     ];

    builds.forEach(build => {
        // Calculate stats for this saved build (using the stateless calculator)
        const calculatedStats = FO2BuildState.calculateStatsForSavedBuildObject(build);

        const buildItem = document.createElement('div');
        buildItem.className = 'saved-build-item expanded'; // Start expanded
        buildItem.dataset.buildId = build.id;

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'build-item-content-wrapper';

        // Column 1: Info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'build-item-info build-column';
        infoDiv.innerHTML = `
            <strong>${build.name || 'Unnamed Build'}</strong>
            <div class="build-item-details">
                By: ${build.creator || 'Unknown'} | Lvl: ${build.level}${ build.rebirth ?
                    ' <img src="assets/build-sandbox/icons/rebirth-icon.png" class="rebirth-inline-icon" alt="R" title="Rebirth">' : ''}
            </div>
            <div class="build-item-description">${build.description || 'No description.'}</div>`;
        infoDiv.addEventListener('click', () => handleLoadBuildClick(build.id));
        contentWrapper.appendChild(infoDiv);

        // Column 2: Calculated Stats
        const statsDiv = document.createElement('div');
        statsDiv.className = 'build-item-calculated-stats build-column';
        if (calculatedStats) {
             statsDiv.innerHTML = `
                 <div class="build-item-resource-bars">
                     <div class="build-item-bar health-bar-small">HP: ${calculatedStats.finalHP}</div>
                     <div class="build-item-bar energy-bar-small">Energy: ${calculatedStats.finalEnergy}</div>
                 </div>
                 <div>
                     <span class="AGI">${calculatedStats.finalStats.agi}</span>/<span class="STR">${calculatedStats.finalStats.str}</span>/<span class="INT">${calculatedStats.finalStats.int}</span>/<span class="STA">${calculatedStats.finalStats.sta}</span>
                 </div>
                 <div><b>DPS:</b> ${Math.round(calculatedStats.finalDPS)} <b>Armor:</b> ${calculatedStats.finalArmor}</div>
                 <div><b>Crit:</b> ${calculatedStats.finalCrit.toFixed(2)}% <b>Dodge:</b>${calculatedStats.finalDodge.toFixed(2)}%</div>
                 <div><b>Dmg:</b> (${calculatedStats.finalMinDamage}-${calculatedStats.finalMaxDamage}) <b>Spd:</b>${(calculatedStats.finalAttackSpeed / 1000.0).toFixed(1)}s</div>
                 <div><b>Mgtn:</b> ${calculatedStats.mitigationPercent.toFixed(2)}%</div>
                 <div><b>HP/s:</b> ${calculatedStats.finalHPRegenPerSecond.toFixed(1)} <b>ENG/s:</b> ${calculatedStats.finalEnergyRegenPerSecond.toFixed(1)}</div>`;
        } else {
            statsDiv.innerHTML = '<div class="error-message">Stats N/A</div>';
        }
        contentWrapper.appendChild(statsDiv);

        // Column 3: Equipment Grid
        const equipDiv = document.createElement('div');
        equipDiv.className = 'build-item-equip-section build-column';
        const equipGrid = document.createElement('div');
        equipGrid.className = 'build-item-equip-grid-single'; // 8x2 grid
        allEquipmentSlotsLayout.forEach(slotName => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'build-item-equip-slot';
            let item = null;
            if (slotName && build.equipment?.[slotName]) {
                item = FO2BuildState.data.itemsById.get(build.equipment[slotName]);
            }
            if (item && item["Sprite-Link"]) {
                 slotDiv.innerHTML = `<img src="${item["Sprite-Link"]}" alt="${item.Name || slotName}" title="${item.Name || slotName}" style="image-rendering: pixelated;">`;
            } else if (item) {
                 slotDiv.innerHTML = `<div class="build-item-equip-slot-text" title="${item.Name}">${item.Name.substring(0, 3)}</div>`;
            } else {
                 slotDiv.classList.add('empty');
            }
            if (item) { // Add tooltip only if item exists
                 slotDiv.addEventListener('mouseenter', function() { showGridItemTooltip(slotDiv, item); }); // Use grid tooltip function
                 slotDiv.addEventListener('mouseleave', () => hideTooltip('item-tooltip'));
            }
            equipGrid.appendChild(slotDiv);
        });
        equipDiv.appendChild(equipGrid);
        contentWrapper.appendChild(equipDiv);

        // Column 4: Buffs
        const buffsDiv = document.createElement('div');
        buffsDiv.className = 'build-item-buffs-section build-column';
        if (build.activeBuffNames?.length > 0) {
            build.activeBuffNames.forEach(buffName => {
                 let buff = null;
                 for (const cat in FO2BuildState.data.buffs) {
                     buff = FO2BuildState.data.buffs[cat]?.find(b => b.Name === buffName);
                     if (buff) break;
                 }
                 if (buff) {
                     const buffIconDiv = document.createElement('div');
                     buffIconDiv.className = 'build-item-buff-icon'; // Larger icon style
                     const baseName = buff.Name.toLowerCase().replace(/\s+\d+$/, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                     const iconFileName = `assets/build-sandbox/icons/${baseName}-icon.png`;
                     buffIconDiv.innerHTML = `<img src="${iconFileName}" alt="${buff.Name}" title="${buff.Name}">`;
                     buffIconDiv.querySelector('img').onerror = () => { buffIconDiv.innerHTML = '?'; };
                     buffIconDiv.addEventListener('mouseenter', (e) => showBuffTooltip(buff, e.currentTarget));
                     buffIconDiv.addEventListener('mouseleave', () => hideTooltip('buff-tooltip'));
                     buffsDiv.appendChild(buffIconDiv);
                 }
            });
        } else {
             buffsDiv.innerHTML = '<div class="build-item-no-buffs">No buffs</div>';
        }
        contentWrapper.appendChild(buffsDiv);

        // Actions Column (Separate)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'build-item-actions';
        actionsDiv.innerHTML = `
            <button class="build-action-button duplicate" title="Duplicate Build">➕</button>
            <button class="build-action-button edit" title="Edit Details">✏️</button>
            <button class="build-action-button delete" title="Delete Build">❌</button>`;
        actionsDiv.querySelector('.duplicate').addEventListener('click', (e) => { e.stopPropagation(); handleDuplicateBuildClick(build.id); });
        actionsDiv.querySelector('.edit').addEventListener('click', (e) => { e.stopPropagation(); openBuildModal(build.id); });
        actionsDiv.querySelector('.delete').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteBuildClick(build.id); });

        buildItem.appendChild(contentWrapper);
        buildItem.appendChild(actionsDiv);
        savedBuildsListContainer.appendChild(buildItem);
    });
}

function openBuildModal(buildId = null) {
    const isEditing = buildId !== null;
    const build = isEditing ? FO2BuildState.findSavedBuildById(buildId) : null;

    modalBuildIdInput.value = buildId || '';
    modalBuildNameInput.value = isEditing ? (build?.name || '') : '';
    modalBuildCreatorInput.value = isEditing ? (build?.creator || '') : '';
    modalBuildDescriptionInput.value = isEditing ? (build?.description || '') : '';
    document.getElementById('modal-title').textContent = isEditing ? 'Edit Build Details' : 'Save New Build';

    // Attach save handler
    modalSaveButton.onclick = () => handleSaveBuildDetails(buildId);

    buildDetailsModal.style.display = 'flex';
    modalBuildNameInput.focus();
}

function closeBuildModal() {
    buildDetailsModal.style.display = 'none';
}

function handleSaveBuildDetails(buildId = null) {
   const name = modalBuildNameInput.value.trim() || 'Unnamed Build';
   const creator = modalBuildCreatorInput.value.trim();
   const description = modalBuildDescriptionInput.value.trim().substring(0, MAX_BUILD_DESCRIPTION_LENGTH);

   if (buildId) { // Editing existing
       const success = FO2BuildState.updateSavedBuild(buildId, { name, creator, description });
       if (success) {
           showNotification(`Build "${name}" details updated.`, 'success');
       } else {
            showNotification(`Error updating build ID ${buildId}.`, 'error');
       }
   } else { // Saving new build from current editor state
        const newBuildData = {
            id: generateBuildId(),
            name: name, creator: creator, description: description,
            level: FO2BuildState.currentBuild.level,
            rebirth: FO2BuildState.currentBuild.rebirth,
            stats: { ...FO2BuildState.currentBuild.statPoints },
            equipment: {}, // Store IDs
            activeBuffNames: FO2BuildState.currentBuild.activeBuffs.map(b => b.Name),
            uiPerformance: { ...FO2BuildState.ui.performance } // Save filters with build
        };
        // Populate equipment IDs
        for (const slot in FO2BuildState.currentBuild.equipment) {
            if (FO2BuildState.currentBuild.equipment[slot]) {
                newBuildData.equipment[slot] = FO2BuildState.currentBuild.equipment[slot]['Item ID'];
            }
        }
        FO2BuildState.addSavedBuild(newBuildData);
        showNotification(`Build "${name}" saved.`, 'success');
   }

   displaySavedBuilds(); // Refresh the list
   closeBuildModal();
}

// Handle clicking the main "Save Current Build" button in the editor
function handleSaveCurrentBuildClick() {
   openBuildModal(); // Open modal for a new build
}

// Handle clicking a build in the saved list to load it into the editor
function handleLoadBuildClick(buildId) {
    // Switch to editor page first
    const editorButton = document.querySelector('.nav-button[data-page="build-editor"]');
    if (editorButton) editorButton.click();

    // Load the build data into the state manager
    FO2BuildState.loadBuildIntoEditor(buildId);
    // updateUIFromState() is called internally by loadBuildIntoEditor
}

function handleDeleteBuildClick(buildId) {
    const build = FO2BuildState.findSavedBuildById(buildId);
    if (build) {
        if (confirm(`Delete build "${build.name}"?`)) {
            const success = FO2BuildState.deleteSavedBuild(buildId);
            if (success) {
                displaySavedBuilds(); // Refresh list
                showNotification(`Build "${build.name}" deleted.`, 'info');
            } else {
                 showNotification("Error deleting build.", 'error');
            }
        }
    }
}

function handleDuplicateBuildClick(buildId) {
    const duplicatedBuild = FO2BuildState.duplicateSavedBuild(buildId);
    if (duplicatedBuild) {
        displaySavedBuilds(); // Refresh list
        showNotification(`Build duplicated as "${duplicatedBuild.name}".`, 'success');
    } else {
        showNotification("Error duplicating build.", 'error');
    }
}

// Function to handle responsive layout adjustments
function handleResponsiveLayout() {
    const windowWidth = window.innerWidth;
    const container = document.querySelector('.container');
    
    // Handle Equipment Layout
    const equipmentSlots = document.querySelectorAll('.equipment-slots');
    if (windowWidth < 768) {
        equipmentSlots.forEach(el => {
            // More compact grid on small screens
            el.style.gridTemplateColumns = 'repeat(auto-fill, minmax(60px, 1fr))';
        });
    } else {
        equipmentSlots.forEach(el => {
            // Reset to default on larger screens
            el.style.gridTemplateColumns = '';
        });
    }
    
    // Additional responsive adjustments as needed
}

// Run on load and when resizing
window.addEventListener('load', handleResponsiveLayout);
window.addEventListener('resize', handleResponsiveLayout);