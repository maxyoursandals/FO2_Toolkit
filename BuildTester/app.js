// Global variables
let baseStats = {
    hp: 18,
    energy: 20,
    atkPower: 40,
    atkSpeed: 1400,
    critical: 6.43,
    dodge: 5.00,
    armor: 0,
    damage: {min: 7, max: 10}
};

let currentStats = {
    level: 1,
    rebirth: false,
    statPoints: {
        agi: 20,
        str: 20,
        int: 20,
        sta: 20
    },
    pointsRemaining: 2,
    equipment: {}
};

// List of bosses
const bossNamesList = [
    "Evil McBadguy", "King Crab", "Skele Champion", "Boulder Colorado", "The Alpha",
    "Undead Master Chef", "McBadguy Redux", "Destroyer of Will", "Destroyer of Faith",
    "Destroyer of Mind", "Gamer's Right Hand", "Gamer's Left Hand", "Alrahur",
    "Anubis", "Gamer's Head", "Stuff of Nightmares", "The Badger King", "Bearserker",
    "Rotten Overlord", "Glacier Union Officer", "Devilish Star", "Froctopus",
    "Evil Pie", "The Future", "Evil McFreezeGuy", "Gen. Biodegradable", "The Kraken",
    "Sea Snake", "Chat", "Cat", "Flying Dutchman", "Troglodyte Scourge", "Taunted Throne",
    "The Dark Elf King", "Wild Turkey", "General Turnip", "Ketchup Krusher", "Root Rotter", 
    "Gourd Digger", "Carrot Spearman", "Eggsecutioner", "Tater Tyrant"
];

const bossNameSet = new Set(bossNamesList);

/**
 * Processes an array of item objects, categorizes them, and builds an ID lookup map.
 * @param {Array<object>} itemArray - The array of item objects loaded from items.json.
 * @returns {object|null} The categorized items object or null on error.
 */
function loadItemData(itemArray) {
    try {
        if (!itemArray || !Array.isArray(itemArray) || itemArray.length === 0) {
            showNotification("No item data loaded or data is invalid.", "error");
            console.warn("No item data provided to loadItemData or data is not an array.");
            // Ensure itemsData and itemsByIdMap are reset to a valid empty state
            itemsData = {
                weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
                equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
            };
            itemsByIdMap = new Map();
            return null;
        }

        const categorizedItems = {
            weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
            equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
        };

        itemArray.forEach(item => {
            if (item.Level !== undefined) item.Level = parseInt(item.Level) || 0;
            if (item.Armor !== undefined && item.Armor !== "") item.Armor = parseInt(item.Armor) || 0;
            else if (item.Armor === "") item.Armor = 0; // Explicitly set to 0 if empty string

            if (item["Atk Spd"] !== undefined && item["Atk Spd"] !== "") item["Atk Spd"] = parseInt(item["Atk Spd"]) || 0;
            else if (item["Atk Spd"] === "") item["Atk Spd"] = 0;

            ["STA", "STR", "INT", "AGI", "Req STA", "Req STR", "Req INT", "Req AGI"].forEach(stat => {
                if (item[stat] !== undefined && item[stat] !== "") {
                    item[stat] = parseInt(item[stat]) || 0;
                } else {
                    item[stat] = 0;
                }
            });

            const damageValues = processDamageString(item.Damage); // Assumes processDamageString is defined
            item.minDamage = damageValues.minDamage;
            item.maxDamage = damageValues.maxDamage;

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
        });

        for (const type in categorizedItems) {
            for (const subtype in categorizedItems[type]) {
                categorizedItems[type][subtype].sort((a, b) => (a.Level || 0) - (b.Level || 0));
            }
        }

        itemsByIdMap.clear(); // Clear previous map data
        itemArray.forEach(item => {
            if (item.hasOwnProperty('Item ID') && item['Item ID'] !== undefined) {
                itemsByIdMap.set(item['Item ID'], item);
            }
        });
        console.log(`Item ID map created/updated with ${itemsByIdMap.size} entries.`);

        itemsData = categorizedItems; // Assign to global
        showNotification(`Successfully processed ${itemArray.length} items.`, 'success');
        return categorizedItems;

    } catch (error) {
        console.error("Error processing item data:", error);
        showNotification("Error processing item data. Check console.", "error");
        itemsData = {
            weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
            equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
        };
        itemsByIdMap = new Map();
        return null;
    }
}

/**
 * Processes mob data from a parsed JSON object, calculates average gold, and caches it.
 * @param {object} data - The parsed mob data object (expected format: { mobs: [...] }).
 * @returns {Array|null} The processed mob data array (mobDataCache) or null on error.
 */
function loadMobsData(data) {
    if (mobDataCache && mobDataCache.length > 0) { // Check if already processed
        console.log("Mob data already processed. Using cache.");
        return mobDataCache;
    }

    try {
        if (!data || !data.mobs || !Array.isArray(data.mobs)) {
            console.error("Invalid mobs data structure passed to loadMobsData:", data);
            showNotification("Error: Invalid mob data format.", "error");
            mobDataCache = [];
            mobsData = mobDataCache; // Ensure global mobsData reflects this
            actualMaxMobLevel = 1;
            return null;
        }

        mobDataCache = data.mobs.map(mob => {
            const avgGold = ((mob.goldMin || 0) + (mob.goldMax || 0)) / 2;
            let avgItemGold = 0;
            if (mob.drops && itemsByIdMap.size > 0) { // Ensure itemsByIdMap is populated
                mob.drops.forEach(drop => {
                    const itemDetails = itemsByIdMap.get(drop.itemId);
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
                xp: mob.factionXp || 0,
                avgGoldPerKill: totalAvgGoldPerKill
                // You might want to include other mob properties like dmgMin, dmgMax, atkSpeed
                // if your performance calculations need them directly from the mob object later.
            };
        });

        if (mobDataCache.length > 0) {
            actualMaxMobLevel = Math.max(...mobDataCache.map(m => m.level || 0), 1);
        } else {
            actualMaxMobLevel = 1;
        }
        mobsData = mobDataCache; // Update the global variable
        console.log(`Processed and cached ${mobDataCache.length} mobs.`);
        return mobDataCache;

    } catch (error) {
        console.error("Error processing mobs data:", error);
        showNotification("Error processing mob data. Check console.", "error");
        mobDataCache = [];
        mobsData = mobDataCache;
        actualMaxMobLevel = 1;
        return null;
    }
}

/**
 * Processes an array of buff objects, parses numeric fields, and categorizes them.
 * @param {Array<object>} buffsArray - The array of buff objects loaded from buffs.json.
 * @returns {object|null} The categorized buffs object or null on error.
 */
function loadBuffsData(buffsArray) {
    try {
        if (!buffsArray || !Array.isArray(buffsArray)) {
            console.error("Invalid buffs data provided to loadBuffsData.");
            buffsData = { "Buff": [], "Morph": [] }; // Reset to default
            return null;
        }

        buffsArray.forEach(buff => {
            // Ensure numeric fields are numbers
            if (buff["ATK Power"] !== undefined && buff["ATK Power"] !== "") buff["ATK Power"] = parseInt(buff["ATK Power"]) || 0; else buff["ATK Power"] = 0;
            if (buff["Crit %"] !== undefined && buff["Crit %"] !== "") buff["Crit %"] = parseFloat(buff["Crit %"]) || 0; else buff["Crit %"] = 0;
            if (buff["ATK Speed"] !== undefined && buff["ATK Speed"] !== "") buff["ATK Speed"] = parseInt(buff["ATK Speed"]) || 0; else buff["ATK Speed"] = 0;
            if (buff["Energy Per Second"] !== undefined && buff["Energy Per Second"] !== "") buff["Energy Per Second"] = parseFloat(buff["Energy Per Second"]) || 0; else buff["Energy Per Second"] = 0;
            if (buff["Health Per Second"] !== undefined && buff["Health Per Second"] !== "") buff["Health Per Second"] = parseFloat(buff["Health Per Second"]) || 0; else buff["Health Per Second"] = 0;
            if (buff["Armor"] !== undefined && buff["Armor"] !== "") buff["Armor"] = parseInt(buff["Armor"]) || 0; else buff["Armor"] = 0;
            if (buff["STR"] !== undefined && buff["STR"] !== "") buff["STR"] = parseInt(buff["STR"]) || 0; else buff["STR"] = 0;
            if (buff["STA"] !== undefined && buff["STA"] !== "") buff["STA"] = parseInt(buff["STA"]) || 0; else buff["STA"] = 0;
            if (buff["AGI"] !== undefined && buff["AGI"] !== "") buff["AGI"] = parseInt(buff["AGI"]) || 0; else buff["AGI"] = 0;
            if (buff["INT"] !== undefined && buff["INT"] !== "") buff["INT"] = parseInt(buff["INT"]) || 0; else buff["INT"] = 0;
        });

        const categorizedBuffs = {
            "Buff": buffsArray.filter(buff => buff.Category === "Buff"),
            "Morph": buffsArray.filter(buff => buff.Category === "Morph")
        };

        buffsData = categorizedBuffs; // Assign to global
        console.log("Buffs data processed and assigned globally:", categorizedBuffs);
        return categorizedBuffs;
    } catch (error) {
        console.error("Error processing buffs data:", error);
        showNotification("Error processing buffs data. Check console.", "error");
        buffsData = { "Buff": [], "Morph": [] }; // Reset on error
        return null;
    }
}

/**
 * Main initialization logic, run after the DOM is fully loaded.
 * Fetches external data, processes it, and sets up the application.
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Optional: Display a loading message/spinner here

    try {
        // --- 1. Fetch all external JSON data ---
        console.log("DOM Loaded. Starting data fetch...");
        const [itemsResponse, mobsResponse, buffsResponse] = await Promise.all([
            fetch('items.json').catch(e => ({ ok: false, statusText: `Workspace items.json failed: ${e.message}`, json: () => Promise.resolve(null) })),
            fetch('mobs.json').catch(e => ({ ok: false, statusText: `Workspace mobs.json failed: ${e.message}`, json: () => Promise.resolve(null) })),
            fetch('buffs.json').catch(e => ({ ok: false, statusText: `Workspace buffs.json failed: ${e.message}`, json: () => Promise.resolve(null) }))
        ]);

        if (!itemsResponse.ok) throw new Error(itemsResponse.statusText || "Failed to load items.json");
        if (!mobsResponse.ok) throw new Error(mobsResponse.statusText || "Failed to load mobs.json");
        if (!buffsResponse.ok) throw new Error(buffsResponse.statusText || "Failed to load buffs.json");

        const rawItemsArray = await itemsResponse.json();
        const rawMobsData = await mobsResponse.json();
        const rawBuffsArray = await buffsResponse.json();

        if (rawItemsArray === null) throw new Error("Items data is null after fetch or parsing.");
        if (rawMobsData === null) throw new Error("Mobs data is null after fetch or parsing.");
        if (rawBuffsArray === null) throw new Error("Buffs data is null after fetch or parsing.");

        console.log("Data fetched successfully.");

        // --- 2. Process loaded data (Order matters) ---
        console.log("Processing item data...");
        loadItemData(rawItemsArray); // Populates global itemsData and itemsByIdMap

        console.log("Processing buff data...");
        loadBuffsData(rawBuffsArray); // Populates global buffsData

        console.log("Processing mob data...");
        loadMobsData(rawMobsData);    // Populates global mobDataCache (and mobsData), uses itemsByIdMap

        // --- 3. Initialize UI and application logic that depends on data ---
        console.log("Initializing UI components...");
        if (Object.keys(buffsData.Buff).length > 0 || Object.keys(buffsData.Morph).length > 0) {
            initializeBuffGrid(); // Needs buffsData
        } else {
            console.warn("Buff data is empty, skipping buff grid initialization.");
        }
        addResetBuffsButton();

        loadSavedBuilds();    // Load the list of saved builds (from localStorage)
        displaySavedBuilds(); // Display them (uses itemsByIdMap, buffsData for tooltips etc.)

        loadCurrentStateFromLocalStorage(); // Load last active state

        // --- 4. Perform initial calculations and UI updates ---
        console.log("Performing initial calculations and UI updates...");
        updateRemainingPoints();
        const initialResults = recalculateBuildStats();
        updateDisplay(initialResults); // This updates main stats AND performance table

        if (mobDataCache && mobDataCache.length > 0) {
            setupLevelFilterSliders(); // Uses actualMaxMobLevel
        } else {
            console.warn("Mob data cache is empty, level filter sliders might not be optimal.");
            // Still call it to set defaults if actualMaxMobLevel remained 1
            setupLevelFilterSliders();
        }

        // --- 5. Setup Event Listeners ---
        console.log("Setting up event listeners...");
        setupNavigation();
        setupEventListeners(); // General UI listeners
        addPerformanceTableSortListeners(); // For performance table

        const saveBuildBtn = document.getElementById('save-build-button');
        if (saveBuildBtn) {
            saveBuildBtn.addEventListener('click', handleSaveCurrentBuildClick);
        }
        const closeBtn = buildDetailsModal.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeBuildModal);
        }
        window.addEventListener('click', function(event) {
            if (event.target == buildDetailsModal) {
                closeBuildModal();
            }
        });

        showNotification("Application loaded successfully!", "success");
        console.log("Application initialized successfully.");

    } catch (error) {
        console.error("CRITICAL INITIALIZATION ERROR:", error);
        showNotification(`Failed to initialize application: ${error.message}. Check console.`, "error");
        // You might want to display a more prominent error message to the user on the page itself
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: red; font-size: 1.2em;">
                <h2>Application Failed to Load</h2>
                <p>There was a critical error during startup: ${error.message}</p>
                <p>Please check the browser console (F12) for more details and ensure data files (items.json, mobs.json, buffs.json) are correctly placed and formatted.</p>
            </div>`;
        }
    } finally {
        // Optional: Hide a loading message/spinner here
        console.log("Initialization process finished.");
    }
});

let activeBuffs = []; // Store active buffs (max 5)

// Global itemsData variable to store all items
let itemsData = { weapon: {}, equipment: {} };
let itemsByIdMap = new Map();
let mobsData = null; // Will be assigned the processed array from mobDataCache
let mobDataCache = null; // Internal cache for processed mob data
let actualMaxMobLevel = 1; // Default
let buffsData = { "Buff": [], "Morph": [] }; // Default empty structure

let performanceSortColumn = 'name'; // Default sort column
let performanceSortAsc = true; // Default sort direction

let performanceMinLevel = 1;
let performanceMaxLevel = 80; // Will be updated dynamically

// --- Saved Builds Variables ---
let savedBuilds = []; // Array to hold saved build objects
const MAX_BUILD_DESCRIPTION_LENGTH = 100; // Character limit
const buildDetailsModal = document.getElementById('build-details-modal');
const modalBuildIdInput = document.getElementById('modal-build-id');
const modalBuildNameInput = document.getElementById('modal-build-name');
const modalBuildCreatorInput = document.getElementById('modal-build-creator');
const modalBuildDescriptionInput = document.getElementById('modal-build-description');
const modalSaveButton = document.getElementById('modal-save-button');
// --- End Saved Builds Variables ---

// DOM Elements
const levelInput = document.getElementById('level');
const levelSlider = document.getElementById('level-slider');
const rebirthCheckbox = document.getElementById('rebirth');
const remainingPointsDisplay = document.getElementById('remaining-points');
const resetButton = document.getElementById('reset-button');
const distributeButton = document.getElementById('distribute-button');
const itemSearchModal = document.getElementById('item-search-modal');
const itemSearchInput = document.getElementById('item-search-input');
const searchResults = document.getElementById('search-results');
const cancelSearchButton = document.getElementById('cancel-search');
const notification = document.getElementById('notification');
const hideBossesCheckbox = document.getElementById('hide-bosses-checkbox');

// Stat inputs
const agiValue = document.getElementById('agi-value');
const strValue = document.getElementById('str-value');
const intValue = document.getElementById('int-value');
const staValue = document.getElementById('sta-value');

// Stat displays
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

// Show notification
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = 'notification ' + type;
    notification.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function calculateNewDodge(totalAgi) {
    let calculatedDodge = 0;
    const agi = Math.max(0, totalAgi); // Ensure AGI isn't negative

    // Tier 1: Points from 1 up to 160
    let pointsInTier1 = Math.min(agi, 160);
    calculatedDodge += pointsInTier1 * 0.25;

    // Stop if all points are used
    if (agi <= 160) {
        return calculatedDodge;
    }

    // Tier 2: Points from 161 up to 320 (Max 160 points in this tier)
    let pointsInTier2 = Math.min(agi - 160, 160); // Points above 160, up to 160 points
    calculatedDodge += pointsInTier2 * 0.125;

    // Stop if all points are used
    if (agi <= 320) {
        return calculatedDodge;
    }

    // Tier 3: Points from 321 up to 640 (Max 320 points in this tier)
    let pointsInTier3 = Math.min(agi - 320, 320); // Points above 320, up to 320 points
    calculatedDodge += pointsInTier3 * 0.0625; // Corrected rate

    // Stop if all points are used
    if (agi <= 640) {
        return calculatedDodge;
    }

    // Tier 4: Points above 640
    let pointsInTier4 = agi - 640; // All points above 640
    calculatedDodge += pointsInTier4 * 0.03125; // Assumed rate halves again

    return calculatedDodge;
}

function calculateCritical(effectiveStats) {
    let critical = baseStats.critical; // Start with base critical
    
    // Calculate raw critical addition from AGI and INT
    let rawCritAddition = 0;
    if (effectiveStats.agi > 20) {
        rawCritAddition += (effectiveStats.agi - 20) * (1/14); // +1/14% (≈0.0714%) per AGI over 20
    }
    if (effectiveStats.int > 20) {
        rawCritAddition += (effectiveStats.int - 20) * (1/14); // +1/14% (≈0.0714%) per INT over 20
    }
    
    // Apply diminishing returns for values above 80%
    if (critical + rawCritAddition <= 80) {
        critical += rawCritAddition;
    } else {
        // If adding raw critical would exceed 80%, add only up to 80% at full value
        if (critical < 80) {
            // Add up to 80% at full value
            let fullValueAddition = 80 - critical;
            critical = 80;
            
            // Half the remaining addition
            let reducedAddition = (rawCritAddition - fullValueAddition) * 0.5;
            critical += reducedAddition;
        } else {
            // Already at or over 80%, apply all additions at half value
            critical += rawCritAddition * 0.5;
        }
    }
    
    return critical;
}

function updateDisplay(results) {
    // Base Stats Display in Middle Panel
    staDisplay.textContent = results.finalStats.sta;
    strDisplay.textContent = results.finalStats.str;
    agiDisplay.textContent = results.finalStats.agi;
    intDisplay.textContent = results.finalStats.int;

    // Derived Stats Display in Middle Panel
    healthValue.textContent = `${results.finalHP}/${results.finalHP}`;
    energyValue.textContent = `${results.finalEnergy}/${results.finalEnergy}`;
    armorDisplay.textContent = results.finalArmor;
    atkspeedDisplay.textContent = (results.finalAttackSpeed / 1000.0).toFixed(1); // Show seconds
    atkpowerDisplay.textContent = results.finalAP;
    critDisplay.textContent = results.finalCrit.toFixed(2) + ' %';
    dodgeDisplay.textContent = results.finalDodge.toFixed(2) + ' %';
    damageDisplay.textContent = `(${results.finalMinDamage}-${results.finalMaxDamage})`;

    const dpsDisplayElement = document.getElementById('dps-display');
    if (dpsDisplayElement) {
        dpsDisplayElement.textContent = Math.round(results.finalDPS);
    } else {
        console.warn("DPS display element ('dps-display') not found.");
    }

    const mitigationDisplayElement = document.getElementById('mitigation-display');
    if (mitigationDisplayElement) {
        mitigationDisplayElement.textContent = results.mitigationPercent.toFixed(2) + ' %';
    } else {
        console.warn("Mitigation display element ('mitigation-display') not found.");
    }

    const hpRegenDisplayElement = document.getElementById('hp-regen-display');
    if (hpRegenDisplayElement) {
        hpRegenDisplayElement.textContent = results.finalHPRegenPerSecond.toFixed(1);
    } else {
        console.warn("HP Regen display element ('hp-regen-display') not found.");
    }

    const energyRegenDisplayElement = document.getElementById('energy-regen-display');
    if (energyRegenDisplayElement) {
        energyRegenDisplayElement.textContent = results.finalEnergyRegenPerSecond.toFixed(1);
    } else {
        console.warn("Energy Regen display element ('energy-regen-display') not found.");
    }

    // Calculate and update performance table
    const perfData = calculatePerformance(results.finalDPS, performanceMinLevel, performanceMaxLevel);
    updatePerformanceTable(perfData);
}

// Calculate available stat points based on level and rebirth status
function calculateAvailablePoints() {
    let points = 0;
    
    // Start with 2 points at level 1
    points = 2;
    
    // Add 2 points per level from level 2 up to current level
    points += (currentStats.level - 1) * 2;
    
    // If rebirth, add 1 extra point for every 4 levels
    if (currentStats.rebirth) {
        points += Math.floor(currentStats.level / 4);
    }
    
    return points;
}

// Calculate used stat points
function calculateUsedPoints() {
    return (
        (currentStats.statPoints.agi - 20) +
        (currentStats.statPoints.str - 20) +
        (currentStats.statPoints.int - 20) +
        (currentStats.statPoints.sta - 20)
    );
}

// Update remaining points
function updateRemainingPoints() {
    const availablePoints = calculateAvailablePoints();
    const usedPoints = calculateUsedPoints();
    const remaining = availablePoints - usedPoints;
    
    currentStats.pointsRemaining = remaining;
    remainingPointsDisplay.textContent = remaining;
}

// Reset all stats to base
function resetStats() {
    currentStats.statPoints = {
        agi: 20,
        str: 20,
        int: 20,
        sta: 20
    };
    
    agiValue.value = 20;
    strValue.value = 20;
    intValue.value = 20;
    staValue.value = 20;
    
    updateRemainingPoints();
    const results = recalculateBuildStats();
    updateDisplay(results);
    saveCurrentStateToLocalStorage();
}

// Distribute points evenly
function distributePoints() {
    resetStats();
    
    let remainingPoints = currentStats.pointsRemaining;
    if (remainingPoints <= 0) return;
    
    // Distribute points evenly among all stats
    const pointsPerStat = Math.floor(remainingPoints / 4);
    const extraPoints = remainingPoints % 4;
    
    currentStats.statPoints.agi += pointsPerStat;
    currentStats.statPoints.str += pointsPerStat;
    currentStats.statPoints.int += pointsPerStat;
    currentStats.statPoints.sta += pointsPerStat;
    
    // Distribute any remaining points
    for (let i = 0; i < extraPoints; i++) {
        switch (i) {
            case 0: currentStats.statPoints.str++; break;
            case 1: currentStats.statPoints.agi++; break;
            case 2: currentStats.statPoints.sta++; break;
            case 3: currentStats.statPoints.int++; break;
        }
    }
    
    // Update UI
    agiValue.value = currentStats.statPoints.agi;
    strValue.value = currentStats.statPoints.str;
    intValue.value = currentStats.statPoints.int;
    staValue.value = currentStats.statPoints.sta;
    
    updateRemainingPoints();
    const results = recalculateBuildStats();
    updateDisplay(results);
    saveCurrentStateToLocalStorage();
}

// Equipment handling
let currentSlot = null;

function openItemSearch(slotElement) {
     const slotName = slotElement.dataset.slot;
     currentSlot = slotName; // Keep track of which slot was clicked

     // Update Title
     const searchTitle = document.getElementById('search-title');
     if (searchTitle) {
         searchTitle.textContent = `Select for ${slotName.charAt(0).toUpperCase() + slotName.slice(1)}`;
     }

     // --- Dynamic Positioning Logic ---
     const slotRect = slotElement.getBoundingClientRect(); // Get position of the clicked slot
     const panelWidth = 150; // The fixed width we set in CSS
     const panelHeight = 300; // The fixed height we set in CSS
     const margin = 5; // Small space between slot and panel

     // Calculate initial desired position (below and slightly right of the slot)
     let potentialTop = slotRect.bottom + margin + window.scrollY;
     let potentialLeft = slotRect.left + window.scrollX; // Align left edge initially

     // Check viewport boundaries and adjust
     // Check Bottom boundary
     if (potentialTop + panelHeight > (window.innerHeight + window.scrollY)) {
         potentialTop = slotRect.top - panelHeight - margin + window.scrollY; // Move above the slot
     }
     // Check Top boundary (if moved above)
     if (potentialTop < window.scrollY) {
          potentialTop = window.scrollY + margin; // Stick near top if still out
     }

     // Check Right boundary
     if (potentialLeft + panelWidth > (window.innerWidth + window.scrollX)) {
          potentialLeft = window.innerWidth + window.scrollX - panelWidth - margin; // Stick near right edge
     }
     // Check Left boundary
     if (potentialLeft < window.scrollX) {
         potentialLeft = window.scrollX + margin; // Stick near left edge
     }

     // Apply the calculated position
     itemSearchModal.style.top = `${potentialTop}px`;
     itemSearchModal.style.left = `${potentialLeft}px`;
     // --- End Dynamic Positioning Logic ---

     // Show the panel using flex display (matches our CSS)
     itemSearchModal.style.display = 'flex';
     itemSearchInput.value = '';
     itemSearchInput.focus(); // Focus after display is set

     // Populate search results
     populateSearchResults(); // Populate with relevant items
 }

function closeItemSearch() {
    itemSearchModal.style.display = 'none';
    itemSearchInput.value = '';
}

function populateSearchResults(query = '') {
    searchResults.innerHTML = '';
    
    if (!itemsData) {
        const noItemsElement = document.createElement('div');
        noItemsElement.className = 'search-item';
        noItemsElement.textContent = 'No items found in database. Please check the console for errors.';
        searchResults.appendChild(noItemsElement);
        return;
    }
    
    // Map slot to item type and subtype
    const slotToTypeMap = {
        head: { type: 'equipment', subtype: 'head' },
        face: { type: 'equipment', subtype: 'face' },
        shoulder: { type: 'equipment', subtype: 'shoulder' },
        chest: { type: 'equipment', subtype: 'chest' },
        legs: { type: 'equipment', subtype: 'legs' },
        back: { type: 'equipment', subtype: 'back' },
        ring1: { type: 'equipment', subtype: 'ring' },
        ring2: { type: 'equipment', subtype: 'ring' },
        trinket1: { type: 'equipment', subtype: 'trinket' },
        trinket2: { type: 'equipment', subtype: 'trinket' },
        guild: { type: 'equipment', subtype: 'guild' },
        faction: { type: 'equipment', subtype: 'faction' },
        offhand: { type: 'equipment', subtype: 'offhand' },
        weapon: { type: 'weapon', subtypes: ['sword', 'bow', 'wand', 'staff', 'hammer', 'axe', 'pickaxe', 'lockpick', '2h sword'] }
    };
    
    // Get items that match the slot
    let matchingItems = [];
    const slotMapping = slotToTypeMap[currentSlot];
    
    if (slotMapping) {
        if (slotMapping.type === 'weapon' && slotMapping.subtypes) {
            // For weapons, we need to check multiple subtypes
            slotMapping.subtypes.forEach(subtype => {
                if (itemsData[slotMapping.type] && itemsData[slotMapping.type][subtype]) {
                    matchingItems = matchingItems.concat(itemsData[slotMapping.type][subtype]);
                }
            });
        } else if (itemsData[slotMapping.type] && itemsData[slotMapping.type][slotMapping.subtype]) {
            matchingItems = itemsData[slotMapping.type][slotMapping.subtype];
        }
    }
    
    // Filter by query if provided
    if (query) {
        const lowerQuery = query.toLowerCase();
        matchingItems = matchingItems.filter(item => 
            item.Name.toLowerCase().includes(lowerQuery) || 
            (item.Level && item.Level.toString().includes(lowerQuery))
        );
    }
    
    // Sort by level
    matchingItems.sort((a, b) => a.Level - b.Level);
    
    // Limit results if too many
    const maxResults = 100;
    if (matchingItems.length > maxResults) {
        const infoElement = document.createElement('div');
        infoElement.className = 'search-info';
        infoElement.textContent = `Showing ${maxResults} of ${matchingItems.length} items. Please refine your search.`;
        searchResults.appendChild(infoElement);
        matchingItems = matchingItems.slice(0, maxResults);
    }
    
    // Add filtered items
    matchingItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'search-item';
        
        // Format stats display
        let statsText = '';
        ['STA', 'STR', 'INT', 'AGI'].forEach(stat => {
            if (item[stat] && item[stat] !== '') {
                const sign = item[stat] > 0 ? '+' : '';
                statsText += `${stat}: ${sign}${item[stat]} `;
            }
        });
        
        if (statsText) statsText = `(${statsText.trim()})`;
        
        // Format requirements
        let reqText = '';
        ['Req STA', 'Req STR', 'Req INT', 'Req AGI'].forEach(req => {
            if (item[req] && item[req] !== '') {
                reqText += `${req.replace('Req ', '')}: ${item[req]} `;
            }
        });
        
        if (reqText) reqText = `[Req: ${reqText.trim()}]`;
        
        // Create display text
        itemElement.textContent = `(Lvl ${item.Level}) ${item.Name}`;
        
        itemElement.addEventListener('click', () => {
            equipItem(currentSlot, item);
            closeItemSearch();
        });
        searchResults.appendChild(itemElement);
    });
    
    // No results message
    if (matchingItems.length === 0) {
        const noResultsElement = document.createElement('div');
        noResultsElement.className = 'search-item';
        noResultsElement.textContent = 'No matching items found.';
        searchResults.appendChild(noResultsElement);
    }
}

function equipItem(slot, item) {
    // Make sure currentStats.equipment exists
    if (!currentStats.equipment) {
        currentStats.equipment = {};
    }
    // 1. Update the data model FIRST
    currentStats.equipment[slot] = item;

    // 2. Update the UI (slot visuals)
    const slotElement = document.querySelector(`.slot[data-slot="${slot}"]`);
    if (!slotElement) {
         console.error(`Could not find slot element for: ${slot}`);
         return; // Exit if slot element not found
    }

    // Remove existing clear button if present
    const existingClearButton = slotElement.querySelector('.clear-slot');
    if (existingClearButton) {
        existingClearButton.remove();
    }

    if (item) { // Equipping an item
        // Display item image
        if (item["Sprite-Link"] && item["Sprite-Link"] !== "") {
            slotElement.innerHTML = `<img src="${item["Sprite-Link"]}" alt="${item.Name || slot}" title="${item.Name || slot}" style="max-width: 40px; max-height: 40px; image-rendering: pixelated;">`;
        } else {
             slotElement.innerHTML = `<div style="width:40px;height:40px;display:flex;justify-content:center;align-items:center;font-size:12px;text-align:center;" title="${item.Name || ''}">${item.Name || '?'}</div>`;
        }

        // Add clear button
        const clearButton = document.createElement('div');
        clearButton.className = 'clear-slot';
        clearButton.textContent = 'x';
        clearButton.title = 'Remove item';
        clearButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent slot click event
            equipItem(slot, null); // Call equipItem with null to unequip
        });
        slotElement.appendChild(clearButton);

    } else { // Unequipping (item is null)
        // Restore default slot icon
        let iconName = slot;
        // Handle special cases for default icon names
        if (slot === 'ring1' || slot === 'ring2') iconName = 'ring';
        if (slot === 'trinket1' || slot === 'trinket2') iconName = 'trinket';

        const defaultIconSrc = `icons/${iconName}-icon.png`;
        const defaultAltText = slot.charAt(0).toUpperCase() + slot.slice(1);
        slotElement.innerHTML = `<img src="${defaultIconSrc}" alt="${defaultAltText}">`;
        // Add error handling for default icons if needed
        slotElement.querySelector('img').onerror = function() {
             this.parentNode.innerHTML = defaultAltText.substring(0, 3); // Fallback text
             this.parentNode.style.cssText = "display:flex; align-items:center; justify-content:center; font-size:10px;";
        };
    }

    // 3. Recalculate stats, update ALL displays, and save state AFTER data and UI are updated
    const results = recalculateBuildStats();
    updateDisplay(results); // This updates main stats AND performance table
    saveCurrentStateToLocalStorage(); // Save the final state

     // 4. Show notification (optional, moved to end)
     // Avoid showing notification for every slot during resetAllEquipment
     const isCalledByReset = new Error().stack.includes('resetAllEquipment');
     if (!isCalledByReset) {
         if(item) {
            showNotification(`Equipped ${item.Name}`, 'success');
         } else {
            showNotification(`Removed item from ${slot}`, 'info');
         }
     }
}

// --- Item Tooltip Functions ---
function showItemTooltip(slotElement) {
    const slotName = slotElement.dataset.slot;
    const item = currentStats.equipment[slotName];

    if (!item) return;

    hideItemTooltip(); // Remove existing tooltip

    const tooltip = document.createElement('div');
    tooltip.className = 'item-tooltip';
    tooltip.id = 'item-tooltip';

    // --- Build Tooltip Content ---

    // 1. Name (Has separator via CSS border-bottom)
    let content = `<div class="tooltip-title">${item.Name}</div>`;

    // 2. Level & Type
    if (item.Level !== undefined) {
        const subtypeText = item.Subtype && item.Subtype.trim() !== '' ? ` ${item.Subtype}` : '';
        content += `<div class="tooltip-level">Level ${item.Level}${subtypeText}</div>`;
    }

    // 3. Stats (Consolidated Section)
    const allStatsHtml = [];
    const statsToCheck = ['STA', 'STR', 'INT', 'AGI', 'Armor']; // Numeric stats
    const stringStatsToCheck = ['Damage']; // String stats like "10-20"
    const specialStatsToCheck = ['Atk Spd']; // Special case for Speed label

    // Numeric Stats (STA, STR, INT, AGI, Armor)
    statsToCheck.forEach(statKey => {
        // Stricter Check: Ensure property exists, is not undefined, not 0, and not an empty string
        if (item.hasOwnProperty(statKey) && item[statKey] !== undefined && item[statKey] !== 0 && item[statKey] !== '') {
            const value = item[statKey];
            const sign = value > 0 ? '+' : '';
            const cssClass = value > 0 ? 'stat-positive' : 'stat-negative';
            allStatsHtml.push(`<div class="${cssClass}">${statKey}: ${sign}${value}</div>`);
        }
    });

    // String Stats (Damage)
    stringStatsToCheck.forEach(statKey => {
         // Stricter Check: Ensure property exists, is not undefined, and not an empty string
        if (item.hasOwnProperty(statKey) && item[statKey] !== undefined && item[statKey] !== '') {
            allStatsHtml.push(`<div>${statKey}: ${item[statKey]}</div>`);
        }
    });

    // Special Stat (Speed / 'Atk Spd')
    specialStatsToCheck.forEach(statKey => {
        // Stricter Check: Ensure property exists, is not undefined, not 0, and not an empty string
        if (item.hasOwnProperty(statKey) && item[statKey] !== undefined && item[statKey] !== 0 && item[statKey] !== '') {
            allStatsHtml.push(`<div>Speed: ${item[statKey]}</div>`);
            // Optional: display as seconds:
            // const speedInSeconds = (item[statKey] / 1000.0).toFixed(1);
            // allStatsHtml.push(`<div>Speed: ${speedInSeconds}s</div>`);
        }
    });


    // Add the consolidated stats section if it has content
    if (allStatsHtml.length > 0) {
        content += `<div class="tooltip-stats">${allStatsHtml.join('')}</div>`;
    }

    // 4. Requirements (Has separator via CSS border-top)
    const requirements = [];
    ['Req STA', 'Req STR', 'Req INT', 'Req AGI'].forEach(reqKey => {
        const statName = reqKey.replace('Req ', '');
        // Stricter Check for requirements: must exist, not undefined, not 0, not empty string
        if (item.hasOwnProperty(reqKey) && item[reqKey] !== undefined && item[reqKey] !== 0 && item[reqKey] !== '') {
            requirements.push(`<div>Requires ${statName}: ${item[reqKey]}</div>`);
        }
    });

    // Add requirements section only if there are any requirements
    if (requirements.length > 0) {
         // Add a separator manually IF there were stats AND there are requirements
         if (allStatsHtml.length > 0) {
              content += `<div style="border-top: 1px solid var(--border); margin: 5px 0;"></div>`;
         }
        content += `<div class="tooltip-req">${requirements.join('')}</div>`;
    }
    // --- End Tooltip Content ---

    tooltip.innerHTML = content;
    document.body.appendChild(tooltip);

    // --- Position Tooltip (same as before) ---
    const slotRect = slotElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 10;

    let left = slotRect.right + margin;
    let top = slotRect.top;

    if (left + tooltipRect.width > window.innerWidth) {
        left = slotRect.left - tooltipRect.width - margin;
    }
    if (top + tooltipRect.height > window.innerHeight) {
        top = window.innerHeight - tooltipRect.height - margin;
    }
    if (top < 0) {
        top = margin;
    }

    tooltip.style.left = `${left + window.scrollX}px`;
    tooltip.style.top = `${top + window.scrollY}px`;

    requestAnimationFrame(() => {
        tooltip.style.opacity = 1;
    });
}

function hideItemTooltip() {
    const existingTooltip = document.getElementById('item-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
}
// --- End Item Tooltip Functions ---

// Level change handling
function handleLevelChange() {
    const newLevel = parseInt(levelInput.value);
    
    // Validate level
    if (currentStats.rebirth) {
        // Rebirth allows up to level 80
        if (newLevel < 1) levelInput.value = 1;
        if (newLevel > 80) levelInput.value = 80;
    } else {
        // Non-rebirth caps at level 60
        if (newLevel < 1) levelInput.value = 1;
        if (newLevel > 60) levelInput.value = 60;
    }
    
    currentStats.level = parseInt(levelInput.value);
    levelSlider.value = currentStats.level;
    
    // Update available points
    updateRemainingPoints();
    const results = recalculateBuildStats();
    updateDisplay(results);
    saveCurrentStateToLocalStorage();
}

function handleRebirthChange() {
    currentStats.rebirth = rebirthCheckbox.checked;
    
    // Update max level
    if (currentStats.rebirth) {
        levelSlider.max = 80;
    } else {
        levelSlider.max = 60;
        if (currentStats.level > 60) {
            currentStats.level = 60;
            levelInput.value = 60;
            levelSlider.value = 60;
        }
    }
    
    // Update available points
    updateRemainingPoints();
    const results = recalculateBuildStats();
    updateDisplay(results);
    saveCurrentStateToLocalStorage();
}

// Stat value change handling
function handleStatChange(stat, value) {
    // Validate stat value
    value = parseInt(value);
    if (value < 20) value = 20;
    
    // Check if we have enough points
    const currentValue = currentStats.statPoints[stat];
    const pointDifference = value - currentValue;
    
    if (pointDifference > currentStats.pointsRemaining) {
        // Not enough points, revert to maximum possible
        value = currentValue + currentStats.pointsRemaining;
    }
    
    // Update stat
    currentStats.statPoints[stat] = value;
    
    // Update UI
    const statInput = document.getElementById(`${stat}-value`);
    statInput.value = value;
    
    // Recalculate
    updateRemainingPoints();
    const results = recalculateBuildStats();
    updateDisplay(results);
    saveCurrentStateToLocalStorage();
}

// Initialize buff grid
function initializeBuffGrid() {
    if (!buffsData) return;
    
    const buffGrid = document.getElementById('buff-grid');
    buffGrid.innerHTML = '';
    
    // Create buff icons for both categories
    Object.keys(buffsData).forEach(category => {
        buffsData[category].forEach(buff => {
            createBuffIcon(buff, buffGrid);
        });
    });
}

function createBuffIcon(buff, container) {
    const buffDiv = document.createElement('div');
    buffDiv.className = 'buff-icon';
    buffDiv.dataset.buffName = buff.Name;
    buffDiv.dataset.category = buff.Category;

    // Extract tier number if present (e.g., "Nerd Rage 6" -> 6)
    const tierMatch = buff.Name.match(/\s(\d+)$/);
    const tier = tierMatch ? tierMatch[1] : null;

    // Generate base name for icon matching (e.g., "Nerd Rage 6" -> "nerd-rage")
    let baseName = buff.Name.toLowerCase()
        .replace(/\s+\d+$/, '') // Remove trailing number if present
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except space/hyphen
        .trim() // Trim whitespace
        .replace(/\s+/g, '-'); // Replace spaces with hyphens

    // Construct the expected image filename (assuming it's in the same folder as the HTML)
    const iconFileName = `Icons/${baseName}-icon.png`;

    // Always create an image tag.
    // The browser will show a broken image icon if the file doesn't exist.
    const imgElement = document.createElement('img');
    imgElement.src = iconFileName;
    imgElement.alt = buff.Name; // Use full name for alt text
    // Add error handling in case the image doesn't load
    imgElement.onerror = function() {
        // Optional: Display text if image fails to load
        // this.parentNode.innerHTML = `<div class="buff-text">${buff.Name.replace(/\s+\d+$/, '')}</div>`;
        // If you want the tier number even on error, add it back here.
        console.warn(`Buff icon not found: ${iconFileName}`);
        // Keep the broken image icon for now, or uncomment the lines above to show text.
    };

    buffDiv.appendChild(imgElement);

    // Add tier indicator if present
    if (tier) {
        const tierSpan = document.createElement('span');
        tierSpan.className = 'buff-tier';
        tierSpan.textContent = tier;
        buffDiv.appendChild(tierSpan);
    }

    // Add click event to toggle buff
    buffDiv.addEventListener('click', function() {
        toggleBuff(buff, this);
    });

    // Add hover effect for tooltip
    buffDiv.addEventListener('mouseenter', function(e) {
        showBuffTooltip(buff, e.target);
    });

    buffDiv.addEventListener('mouseleave', function() {
        hideBuffTooltip();
    });

    container.appendChild(buffDiv);
}

// Show tooltip with buff details
function showBuffTooltip(buff, element) {
    // Remove any existing tooltip
    hideBuffTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'buff-tooltip';
    tooltip.id = 'buff-tooltip';
    
    let tooltipContent = `<div class="tooltip-title">${buff.Name} (${buff.Category})</div>`;
    
    // Add effects
    const effects = [];
    
    if (buff["ATK Power"] !== undefined && buff["ATK Power"] !== "") {
        const sign = buff["ATK Power"] > 0 ? '+' : '';
        const cssClass = buff["ATK Power"] > 0 ? 'effect-positive' : 'effect-negative';
        effects.push(`<div class="buff-effect ${cssClass}">ATK Power: ${sign}${buff["ATK Power"]}</div>`);
    }
    
    if (buff["Crit %"] !== undefined && buff["Crit %"] !== "") {
        const sign = buff["Crit %"] > 0 ? '+' : '';
        const cssClass = buff["Crit %"] > 0 ? 'effect-positive' : 'effect-negative';
        effects.push(`<div class="buff-effect ${cssClass}">Crit: ${sign}${buff["Crit %"]}%</div>`);
    }
    
    if (buff["ATK Speed"] !== undefined && buff["ATK Speed"] !== "") {
        const sign = buff["ATK Speed"] > 0 ? '+' : '';
        // For ATK Speed, negative is actually positive (faster)
        const cssClass = buff["ATK Speed"] < 0 ? 'effect-positive' : 'effect-negative';
        effects.push(`<div class="buff-effect ${cssClass}">ATK Speed: ${sign}${buff["ATK Speed"]}</div>`);
    }
    
    if (buff["Energy Per Second"] !== undefined && buff["Energy Per Second"] !== "") {
        const sign = buff["Energy Per Second"] > 0 ? '+' : '';
        const cssClass = buff["Energy Per Second"] > 0 ? 'effect-positive' : 'effect-negative';
        effects.push(`<div class="buff-effect ${cssClass}">Energy Per Second: ${sign}${buff["Energy Per Second"]}</div>`);
    }
    
    if (buff["Health Per Second"] !== undefined && buff["Health Per Second"] !== "") {
        const sign = buff["Health Per Second"] > 0 ? '+' : '';
        const cssClass = buff["Health Per Second"] > 0 ? 'effect-positive' : 'effect-negative';
        effects.push(`<div class="buff-effect ${cssClass}">Health Per Second: ${sign}${buff["Health Per Second"]}</div>`);
    }
    
    if (buff["Armor"] !== undefined && buff["Armor"] !== "") {
        const sign = buff["Armor"] > 0 ? '+' : '';
        const cssClass = buff["Armor"] > 0 ? 'effect-positive' : 'effect-negative';
        effects.push(`<div class="buff-effect ${cssClass}">Armor: ${sign}${buff["Armor"]}</div>`);
    }
    
    if (buff["STR"] !== undefined && buff["STR"] !== "") {
        const sign = buff["STR"] > 0 ? '+' : '';
        const cssClass = buff["STR"] > 0 ? 'effect-positive' : 'effect-negative';
        effects.push(`<div class="buff-effect ${cssClass}">STR: ${sign}${buff["STR"]}</div>`);
    }
    
    if (buff["STA"] !== undefined && buff["STA"] !== "") {
        const sign = buff["STA"] > 0 ? '+' : '';
        const cssClass = buff["STA"] > 0 ? 'effect-positive' : 'effect-negative';
        effects.push(`<div class="buff-effect ${cssClass}">STA: ${sign}${buff["STA"]}</div>`);
    }
    
    if (buff["AGI"] !== undefined && buff["AGI"] !== "") {
        const sign = buff["AGI"] > 0 ? '+' : '';
        const cssClass = buff["AGI"] > 0 ? 'effect-positive' : 'effect-negative';
        effects.push(`<div class="buff-effect ${cssClass}">AGI: ${sign}${buff["AGI"]}</div>`);
    }
    
    if (buff["INT"] !== undefined && buff["INT"] !== "") {
        const sign = buff["INT"] > 0 ? '+' : '';
        const cssClass = buff["INT"] > 0 ? 'effect-positive' : 'effect-negative';
        effects.push(`<div class="buff-effect ${cssClass}">INT: ${sign}${buff["INT"]}</div>`);
    }
    
    tooltipContent += effects.join('');
    
    tooltip.innerHTML = tooltipContent;
    document.body.appendChild(tooltip);
    
    // Position the tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 10}px`;
    tooltip.style.top = `${rect.top}px`;
    
    // Make visible
    setTimeout(() => {
        tooltip.style.opacity = 1;
    }, 10);
}

// Hide buff tooltip
function hideBuffTooltip() {
    const existingTooltip = document.getElementById('buff-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
}

// Toggle buff active state
function toggleBuff(buff, element) {
    const isActive = element.classList.contains('active');
    const buffName = buff.Name;
    
    if (isActive) {
        // Deactivate the buff
        element.classList.remove('active');
        activeBuffs = activeBuffs.filter(b => b.Name !== buffName);
    } else {
        // Check if we're at max buffs
        if (activeBuffs.length >= 5) {
            showNotification("Maximum of 5 buffs allowed. Remove one first.", "error");
            return;
        }
        
        // Activate the buff
        element.classList.add('active');
        activeBuffs.push(buff);
    }
    
    // Update active buffs count
    document.getElementById('active-buffs-count').textContent = `(${activeBuffs.length}/5)`;
    
    // Recalculate stats with the new buffs
    const results = recalculateBuildStats();
    updateDisplay(results);
    saveCurrentStateToLocalStorage();
}

// Process damage range - FIXED version
function processDamageString(damageString) {
    // Initialize default values
    let minDamage = 0;
    let maxDamage = 0;
    
    // Only process if we have a valid string
    if (damageString && typeof damageString === 'string' && damageString !== '') {
        // Check for standard damage range pattern (e.g., "5-8")
        const damageMatch = damageString.match(/(\d+)-(\d+)/);
        if (damageMatch) {
            minDamage = parseInt(damageMatch[1]) || 0;
            maxDamage = parseInt(damageMatch[2]) || 0;
        } 
        // Check for K notation (e.g., "1K-2K")
        else if (damageString.includes('K')) {
            const specialMatch = damageString.match(/(\d+)K-(\d+)K/);
            if (specialMatch) {
                minDamage = (parseInt(specialMatch[1]) || 0) * 1000;
                maxDamage = (parseInt(specialMatch[2]) || 0) * 1000;
            }
        } 
        // Check for single value
        else if (!isNaN(parseInt(damageString))) {
            minDamage = parseInt(damageString) || 0;
            maxDamage = minDamage;
        }
    }
    
    return { minDamage, maxDamage };
}

// Save build to local storage
function saveBuild(name) {
    if (!name) name = `Build ${new Date().toLocaleString()}`;
    
    const build = {
        name: name,
        level: currentStats.level,
        rebirth: currentStats.rebirth,
        stats: { ...currentStats.statPoints },
        equipment: { ...currentStats.equipment }
    };
    
    // Get existing builds
    let builds = JSON.parse(localStorage.getItem('fantasy-online-builds') || '[]');
    builds.push(build);
    
    // Save to local storage
    localStorage.setItem('fantasy-online-builds', JSON.stringify(builds));
    
    showNotification(`Build "${name}" saved!`, 'success');
}

// Load build from local storage
function loadBuild(buildIndex) {
    const builds = JSON.parse(localStorage.getItem('fantasy-online-builds') || '[]');
    
    if (buildIndex >= 0 && buildIndex < builds.length) {
        const build = builds[buildIndex];
        
        // Apply build
        currentStats.level = build.level;
        currentStats.rebirth = build.rebirth;
        currentStats.statPoints = { ...build.stats };
        
        // Update UI
        levelInput.value = build.level;
        levelSlider.value = build.level;
        rebirthCheckbox.checked = build.rebirth;
        
        agiValue.value = build.stats.agi;
        strValue.value = build.stats.str;
        intValue.value = build.stats.int;
        staValue.value = build.stats.sta;
        
        // Handle equipment
        if (build.equipment) {
            // Clear current equipment
            Object.keys(currentStats.equipment).forEach(slot => {
                currentStats.equipment[slot] = null;
                const slotElement = document.querySelector(`.slot[data-slot="${slot}"]`);
                if (slotElement) {
                    slotElement.innerHTML = `<img src="/api/placeholder/40/40" alt="${slot}">`;
                }
            });
            
            // Apply saved equipment
            Object.entries(build.equipment).forEach(([slot, item]) => {
                if (item) {
                    equipItem(slot, item);
                }
            });
        }
        
        updateRemainingPoints();
        const results = recalculateBuildStats();
        updateDisplay(results);
        
        showNotification(`Build "${build.name}" loaded!`, 'success');
    } else {
        showNotification('Build not found!', 'error');
    }
}
		// Add function to reset all equipment
		function resetAllEquipment() {
			// Get all equipment slots
			const slots = document.querySelectorAll('.slot');
			
			// Remove equipment from each slot
			slots.forEach(slot => {
				const slotName = slot.dataset.slot;
				equipItem(slotName, null);
			});
			
            saveCurrentStateToLocalStorage();
			showNotification('All equipment has been removed', 'info');
		}

		// Add event listener for the reset equipment button
		document.getElementById('reset-equipment-button').addEventListener('click', resetAllEquipment);

/**
 * Unified Stat Calculation Engine.
 * Calculates all derived stats based on provided character attributes, equipment, and buffs.
 * @param {number} level - Character's level.
 * @param {boolean} rebirth - Character's rebirth status.
 * @param {object} allocatedStatPoints - Base points allocated by the player (e.g., {agi: 25, str: 30,...}).
 * @param {object} equippedItemObjects - A map of slotName: itemObject for all equipped items.
 * @param {Array<object>} activeBuffObjects - An array of active buff objects.
 * @param {object} baseGameConfig - Contains base values like unarmed damage, speed, base AP (current global `baseStats`).
 * @returns {object} An object with all final calculated stats.
 */
function performFullStatCalculation(level, rebirth, allocatedStatPoints, equippedItemObjects, activeBuffObjects, baseGameConfig) {
    // 1. Initialize Final Character Stats (AGI, STR, INT, STA)
    // These start with the base 20 and add points allocated beyond that.
    const finalCharacterStats = {
        agi: 20 + (allocatedStatPoints.agi - 20),
        str: 20 + (allocatedStatPoints.str - 20),
        int: 20 + (allocatedStatPoints.int - 20),
        sta: 20 + (allocatedStatPoints.sta - 20)
    };

    // 2. Accumulators for direct bonuses from items and buffs
    let totalDirectArmorBonus = 0;
    let totalDirectAPBonus = 0;
    // totalDirectCritPercentBonus will be handled by summing buff crit and then applying DR
    let totalHPRegenPerSecond = 0;
    let totalEnergyRegenPerSecond = 0;

    // 3. Base weapon characteristics (unarmed defaults)
    let currentWeaponMinDamage = baseGameConfig.damage.min;
    let currentWeaponMaxDamage = baseGameConfig.damage.max;
    let currentBaseAttackSpeed = baseGameConfig.atkSpeed;

    // 4. Process Equipped Items
    for (const slot in equippedItemObjects) {
        const item = equippedItemObjects[slot];
        if (item) {
            finalCharacterStats.agi += item.AGI || 0;
            finalCharacterStats.str += item.STR || 0;
            finalCharacterStats.int += item.INT || 0;
            finalCharacterStats.sta += item.STA || 0;

            totalDirectArmorBonus += item.Armor || 0;
            // totalDirectAPBonus += item.AtkPower || 0; // If items could provide direct AP
            // totalDirectCritPercentBonus += item.CritPercent || 0; // If items could provide direct Crit%

            if (slot === 'weapon' && item.minDamage !== undefined && item.maxDamage !== undefined) {
                currentWeaponMinDamage = item.minDamage;
                currentWeaponMaxDamage = item.maxDamage;
                currentBaseAttackSpeed = item["Atk Spd"] || baseGameConfig.atkSpeed;
            }
        }
    }

    // 5. Process Active Buffs
    let rawBuffCritPercentContribution = 0;
    let buffAttackSpeedModifier = 0; // For non-stacking or specific logic if needed
    let atkSpeedBuffApplied = false; // For non-stacking speed buffs

    activeBuffObjects.forEach(buff => {
        finalCharacterStats.agi += buff.AGI || 0;
        finalCharacterStats.str += buff.STR || 0;
        finalCharacterStats.int += buff.INT || 0;
        finalCharacterStats.sta += buff.STA || 0;

        totalDirectArmorBonus += buff.Armor || 0;
        totalDirectAPBonus += buff["ATK Power"] || 0;
        rawBuffCritPercentContribution += buff["Crit %"] || 0;

        if (buff["Health Per Second"] !== undefined && buff["Health Per Second"] !== "") {
            totalHPRegenPerSecond += Number(buff["Health Per Second"]) || 0;
        }
        if (buff["Energy Per Second"] !== undefined && buff["Energy Per Second"] !== "") {
            totalEnergyRegenPerSecond += Number(buff["Energy Per Second"]) || 0;
        }

        // Handle Attack Speed from buffs (assuming only one main speed buff applies)
        if (buff["ATK Speed"] !== undefined && buff["ATK Speed"] !== "" && !atkSpeedBuffApplied) {
             // Note: Game mechanics might vary (e.g., is it additive to base, or a replacement?)
             // Current logic adds it. A negative value speeds up.
            currentBaseAttackSpeed += parseInt(buff["ATK Speed"]) || 0;
            atkSpeedBuffApplied = true; // Assuming only one such primary buff applies. Adjust if stackable.
        }
    });

    // --- 6. Calculate Final Derived Stats ---

    // HP and Energy
    const baseHpConst = 1080; // Consider moving to baseGameConfig
    const baseEnergyConst = 1200; // Consider moving to baseGameConfig
    let finalHP = Math.round(baseHpConst / 60 * level);
    let finalEnergy = Math.round(baseEnergyConst / 60 * level);
    finalHP += Math.max(0, finalCharacterStats.sta - 20) * 20;
    finalEnergy += Math.max(0, finalCharacterStats.int - 20) * 15;

    // Armor
    let finalArmor = Math.max(0, finalCharacterStats.str - 20) * 5; // Armor from STR
    finalArmor += totalDirectArmorBonus; // Armor from items and buffs
    finalArmor = Math.max(0, finalArmor);

    // Mitigation
    let mitigationPercent = 0;
    const kValue = 200 + 50 * level;
    if ((kValue + finalArmor) > 0) {
        mitigationPercent = (finalArmor / (kValue + finalArmor)) * 100;
    }

    // Attack Speed
    let finalAttackSpeed = Math.max(100, currentBaseAttackSpeed); // Ensure minimum speed

    // Attack Power (AP)
    let finalAP = baseGameConfig.atkPower; // Start with base (e.g., 40)
    let highestStatValue = 0;
    let isStrHighestDriver = false;
    if (finalCharacterStats.str >= 20) { highestStatValue = finalCharacterStats.str; isStrHighestDriver = true; }
    if (finalCharacterStats.agi > highestStatValue) { highestStatValue = finalCharacterStats.agi; isStrHighestDriver = false; }
    if (finalCharacterStats.int > highestStatValue) { highestStatValue = finalCharacterStats.int; isStrHighestDriver = false; }
    if (finalCharacterStats.sta > highestStatValue) { highestStatValue = finalCharacterStats.sta; isStrHighestDriver = false; }
    // If STR is equal to another highest stat, STR takes precedence for AP
    if (!isStrHighestDriver && finalCharacterStats.str === highestStatValue && finalCharacterStats.str >= 20) { isStrHighestDriver = true; }


    let apFromPrimaryStats = 0;
    let apFromSecondaryStr = 0;
    if (isStrHighestDriver) {
        apFromPrimaryStats = (finalCharacterStats.str - 20) * 3;
    } else {
        if (highestStatValue >= 20) { apFromPrimaryStats = (highestStatValue - 20) * 2; }
        if (finalCharacterStats.str > 20) { apFromSecondaryStr = (finalCharacterStats.str - 20) * 1; }
    }
    finalAP += Math.max(0, apFromPrimaryStats);
    finalAP += Math.max(0, apFromSecondaryStr);
    finalAP += totalDirectAPBonus; // Add direct AP from buffs (and items if they had it)
    finalAP = Math.max(0, finalAP);

    // Critical Chance
    // Calculate crit from AGI/INT (includes its own DR)
    let critFromStats = calculateCritical(finalCharacterStats);
    let finalCrit = critFromStats;
    // Add crit from buffs, applying DR if the total goes over thresholds
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
    let finalDodge = calculateNewDodge(finalCharacterStats.agi);
    finalDodge = Math.max(0, finalDodge);

    // Final Min/Max Damage (incorporating AP bonus)
    const attackSpeedInSeconds = finalAttackSpeed / 1000.0;
    const damageBonusFromAP = Math.floor((finalAP * attackSpeedInSeconds) / 14);
    let finalMinDamage = currentWeaponMinDamage + damageBonusFromAP;
    let finalMaxDamage = currentWeaponMaxDamage + damageBonusFromAP;

    // DPS
    let finalDPS = 0;
    if (finalAttackSpeed > 0) {
        const avgHit = (finalMinDamage + finalMaxDamage) / 2;
        const attacksPerSec = 1000.0 / finalAttackSpeed;
        const critMultiplier = 1.0 + (finalCrit / 100.0); // Assuming crit doubles damage (2.0 - 1.0 = 1.0 multiplier bonus)
        finalDPS = avgHit * attacksPerSec * critMultiplier;
    }

    return {
        finalStats: finalCharacterStats, // The AGI,STR,INT,STA after all bonuses
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
}

/**
 * Recalculates stats for the currently active character build in the editor.
 * Gathers current state and calls the unified calculation engine.
 */
function recalculateBuildStats() {
    const resolvedEquippedItems = {};
    for (const slot in currentStats.equipment) {
        if (currentStats.equipment[slot]) { // Ensure item object exists
            resolvedEquippedItems[slot] = currentStats.equipment[slot];
        }
    }

    const results = performFullStatCalculation(
        currentStats.level,
        currentStats.rebirth,
        currentStats.statPoints,
        resolvedEquippedItems, // currentStats.equipment already holds full item objects
        activeBuffs,          // global activeBuffs holds full buff objects
        baseStats             // global baseStats acts as baseGameConfig
    );
    return results;
}

/**
 * Calculates stats for a given saved build object.
 * Resolves item IDs and buff names to full objects, then calls the unified calculation engine.
 * @param {object} build - The saved build object.
 * @returns {object|null} Calculated stats or null on error.
 */
function calculateStatsForSavedBuild(build) {
    if (!build || !itemsByIdMap || !buffsData) {
        console.error("calculateStatsForSavedBuild: Missing build data, item map, or buff data.");
        return null;
    }

    // Resolve equipped item IDs to full item objects
    const resolvedEquippedItems = {};
    if (build.equipment) {
        for (const slot in build.equipment) {
            const itemId = build.equipment[slot];
            if (itemId !== undefined && itemId !== null) { // Check if there is an ID to look up
                const item = itemsByIdMap.get(itemId);
                if (item) {
                    resolvedEquippedItems[slot] = item;
                } else {
                    console.warn(`calculateStatsForSavedBuild: Item ID ${itemId} for slot ${slot} not found.`);
                }
            }
        }
    }

    // Resolve active buff names to full buff objects
    const resolvedActiveBuffs = [];
    if (build.activeBuffNames) {
        build.activeBuffNames.forEach(buffName => {
            let foundBuff = null;
            for (const category in buffsData) { // Iterate through buff categories (e.g., "Buff", "Morph")
                if(buffsData[category]){
                    foundBuff = buffsData[category].find(b => b.Name === buffName);
                    if (foundBuff) break;
                }
            }
            if (foundBuff) {
                resolvedActiveBuffs.push(foundBuff);
            } else {
                console.warn(`calculateStatsForSavedBuild: Buff named "${buffName}" not found.`);
            }
        });
    }

    const results = performFullStatCalculation(
        build.level,
        build.rebirth,
        build.stats, // This is the allocatedStatPoints from the saved build
        resolvedEquippedItems,
        resolvedActiveBuffs,
        baseStats // Pass the global baseStats
    );
    return results;
}
        
// Event Listeners

// Level input
levelInput.addEventListener('change', handleLevelChange);
levelSlider.addEventListener('input', function() {
    levelInput.value = this.value;
    handleLevelChange();
});

// Rebirth checkbox
rebirthCheckbox.addEventListener('change', handleRebirthChange);

// Stat inputs
agiValue.addEventListener('change', function() {
    handleStatChange('agi', this.value);
});

strValue.addEventListener('change', function() {
    handleStatChange('str', this.value);
});

intValue.addEventListener('change', function() {
    handleStatChange('int', this.value);
});

staValue.addEventListener('change', function() {
    handleStatChange('sta', this.value);
});

// Stat buttons
document.querySelectorAll('.stat-button').forEach(button => {
    button.addEventListener('click', function() {
        const stat = this.dataset.stat;
        const action = this.classList.contains('increase') ? 'max' :
                      this.classList.contains('decrease') ? 'min' : 'reset';
        
        let newValue = currentStats.statPoints[stat];
        
        if (action === 'max' && currentStats.pointsRemaining > 0) {
            // Max - add all remaining points to this stat
            newValue += currentStats.pointsRemaining;
        } else if (action === 'min') {
            // Min - reset to base 20
            newValue = 20;
        } else if (action === 'reset') {
            // Reset to base 20
            newValue = 20;
        }
        
        handleStatChange(stat, newValue);
    });
});

// Reset and Distribute buttons
resetButton.addEventListener('click', resetStats);
distributeButton.addEventListener('click', distributePoints);

// Equipment slots
document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', function() {
        openItemSearch(this.dataset.slot);
    });
});

// Item search
itemSearchInput.addEventListener('input', function() {
    populateSearchResults(this.value);
});

cancelSearchButton.addEventListener('click', closeItemSearch);

// Properly initialize and handle the DOM loading


// Setup all event listeners
function setupEventListeners() {
    // Level input
    levelInput.addEventListener('change', handleLevelChange);
    levelSlider.addEventListener('input', function() {
        levelInput.value = this.value;
        handleLevelChange();
    });

    // Rebirth checkbox
    rebirthCheckbox.addEventListener('change', handleRebirthChange);

    // Stat inputs
    agiValue.addEventListener('change', function() {
        handleStatChange('agi', this.value);
    });

    strValue.addEventListener('change', function() {
        handleStatChange('str', this.value);
    });

    intValue.addEventListener('change', function() {
        handleStatChange('int', this.value);
    });

    staValue.addEventListener('change', function() {
        handleStatChange('sta', this.value);
    });

    if (hideBossesCheckbox) {
        hideBossesCheckbox.addEventListener('change', () => {
            // Trigger table update when checkbox changes
            const currentDPS = parseFloat(document.getElementById('dps-display').textContent) || 0;
            // Get current slider values (already global or read them again)
            const minLvl = performanceMinLevel; 
            const maxLvl = performanceMaxLevel;
            // Recalculate with the new checkbox state influencing the filter
            const perfData = calculatePerformance(currentDPS, minLvl, maxLvl);
            updatePerformanceTable(perfData); // Update the visual table
            saveCurrentStateToLocalStorage(); // Save the new checkbox state
        });
    } else {
        console.error("Hide Bosses checkbox element not found!");
    }

    // Stat buttons
    document.querySelectorAll('.stat-button').forEach(button => {
        button.addEventListener('click', function() {
            const stat = this.dataset.stat;
            const action = this.classList.contains('increase') ? 'max' :
                          this.classList.contains('decrease') ? 'min' : 'reset';

            let newValue = currentStats.statPoints[stat];

            if (action === 'max' && currentStats.pointsRemaining > 0) {
                // Max - add all remaining points to this stat
                newValue += currentStats.pointsRemaining;
            } else if (action === 'min') {
                // Min - reset to base 20
                newValue = 20;
            } else if (action === 'reset') {
                // Reset to base 20
                newValue = 20;
            }

            handleStatChange(stat, newValue);
        });
    });

    // Reset and Distribute buttons
    resetButton.addEventListener('click', resetStats);
    distributeButton.addEventListener('click', distributePoints);

    // Equipment slots - Attach listeners correctly within the loop
    document.querySelectorAll('.slot').forEach(slot => {
        // Make sure it's not a placeholder before adding listeners
        if (!slot.classList.contains('placeholder')) {
            // CLICK LISTENER MODIFIED: pass 'this' (the clicked element)
            slot.addEventListener('click', function() {
                openItemSearch(this); // Pass the element itself
            });

            // Tooltip listeners (remain the same)
            slot.addEventListener('mouseenter', function() {
                showItemTooltip(this);
            });
            slot.addEventListener('mouseleave', function() {
                hideItemTooltip();
            });
        }
    });

    // Item search input
    itemSearchInput.addEventListener('input', function() {
        populateSearchResults(this.value);
    });

    // Item search cancel button
    cancelSearchButton.addEventListener('click', closeItemSearch);

    // Reset Equipment Button
    document.getElementById('reset-equipment-button').addEventListener('click', resetAllEquipment);

    // Note: The Reset Buffs button listener is added later by the addResetBuffsButton() function
}

function resetAllBuffs() {
    document.querySelectorAll('.buff-icon.active').forEach(buffIcon => {
        buffIcon.classList.remove('active');
    });
    
    activeBuffs = [];
    document.getElementById('active-buffs-count').textContent = '(0/5)';
    
    // Recalculate stats
    const results = recalculateBuildStats();
    updateDisplay(results);
    saveCurrentStateToLocalStorage();
    
    showNotification('All buffs have been removed', 'info');
}

function addResetBuffsButton() {
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        const resetBuffsButton = document.createElement('button');
        resetBuffsButton.className = 'action-button';
        resetBuffsButton.id = 'reset-buffs-button';
        resetBuffsButton.textContent = 'Reset Buffs';
        resetBuffsButton.addEventListener('click', resetAllBuffs);
        
        actionButtons.appendChild(resetBuffsButton);
    }
}

function saveCurrentStateToLocalStorage() {
    // Prepare only the necessary data to save (using IDs/names)
    const saveData = {
        level: currentStats.level,
        rebirth: currentStats.rebirth,
        stats: currentStats.statPoints, // Save the stat points directly
        equipment: {}, // Store Item IDs for equipment
        activeBuffNames: activeBuffs.map(buff => buff.Name), // Store Names for buffs
        minFilterLevel: performanceMinLevel,
        maxFilterLevel: performanceMaxLevel,
        hideBosses: hideBossesCheckbox ? hideBossesCheckbox.checked : false
    };

    // Populate equipment Item IDs
    for (const slot in currentStats.equipment) {
        if (currentStats.equipment[slot]) {
            // Use the correct property name for Item ID ('Item ID' with space)
            const itemId = currentStats.equipment[slot]['Item ID'];
            if (itemId !== undefined) {
                saveData.equipment[slot] = itemId;
            } else {
                 console.warn(`Item in slot ${slot} missing 'Item ID':`, currentStats.equipment[slot]);
            }
        }
    }

    try {
        localStorage.setItem('fo2BuildTesterSave', JSON.stringify(saveData));
        console.log("Build saved to localStorage (including slider levels)."); // Optional confirmation
    } catch (e) {
        console.error("Failed to save build to localStorage:", e);
        // Handle potential errors (e.g., storage full)
        showNotification("Could not save build state.", "error");
    }
}

function loadCurrentStateFromLocalStorage() {
    const savedDataString = localStorage.getItem('fo2BuildTesterSave');
    if (!savedDataString) {
        console.log("No saved build found in localStorage.");
        // Keep default globals (1 and 80 placeholder) if no save
        performanceMinLevel = 1;
        performanceMaxLevel = 80; // Use placeholder initially
        return; // No saved data found
    }

    try {
        const savedData = JSON.parse(savedDataString);
        console.log("Loading build from localStorage:", savedData);

        // --- Apply Saved Data ---

        // Level and Rebirth
        currentStats.level = savedData.level || 1;
        currentStats.rebirth = savedData.rebirth || false;
        levelInput.value = currentStats.level;
        levelSlider.value = currentStats.level;
        rebirthCheckbox.checked = currentStats.rebirth;
        if (currentStats.rebirth) {
             levelSlider.max = 80;
             levelInput.max = 80;
         } else {
             levelSlider.max = 60;
             levelInput.max = 60;
             if (currentStats.level > 60) {
                 currentStats.level = 60;
                 levelInput.value = 60;
                 levelSlider.value = 60;
             }
         }

        // Stats
        currentStats.statPoints = savedData.stats || { agi: 20, str: 20, int: 20, sta: 20 };
        agiValue.value = currentStats.statPoints.agi;
        strValue.value = currentStats.statPoints.str;
        intValue.value = currentStats.statPoints.int;
        staValue.value = currentStats.statPoints.sta;

        if (hideBossesCheckbox) {
             hideBossesCheckbox.checked = savedData.hideBosses || false; 
        }

        // Load slider positions into global variables if they exist
        performanceMinLevel = parseInt(savedData.minFilterLevel) || 1; // Default to 1 if missing/invalid
        performanceMaxLevel = parseInt(savedData.maxFilterLevel) || 80; // Default to placeholder 80 if missing/invalid
         // Basic validation: ensure min isn't > max after loading (setupLevelFilterSliders will handle final clamping)
         if (performanceMinLevel > performanceMaxLevel) {
             performanceMinLevel = 1; // Reset min if invalid state loaded
             performanceMaxLevel = 80; // Reset max to placeholder
         }
         console.log(`Loaded slider levels into globals: Min=${performanceMinLevel}, Max=${performanceMaxLevel}`);

        if (savedData.equipment && itemsData && itemsByIdMap.size > 0) {
            resetAllEquipment();
            console.log("Loading equipment from saved data...");
            for (const slot in savedData.equipment) {
                const itemIdToLoad = savedData.equipment[slot];
                const itemToEquip = itemsByIdMap.get(itemIdToLoad);
                if (itemToEquip) {
                    equipItem(slot, itemToEquip);
                } else {
                     if (itemIdToLoad !== undefined && itemIdToLoad !== null) {
                        console.warn(`Could not find item with ID ${itemIdToLoad} in itemsByIdMap for slot ${slot} during load.`);
                     } else {
                        console.warn(`Invalid or missing Item ID found in saved data for slot ${slot}.`);
                     }
                }
            }
        } else {
             console.log("Skipping equipment load (No saved equipment, items not loaded, or map empty).");
             resetAllEquipment();
        }

         if (savedData.activeBuffNames && buffsData) {
             const buffGrid = document.getElementById('buff-grid');
             if (buffGrid && buffGrid.children.length > 0) { // Ensure grid is populated
                 resetAllBuffs();
                 console.log("Loading active buffs...");
                 savedData.activeBuffNames.forEach(buffNameToLoad => {
                     let buffToActivate = null;
                     let buffElement = null;
                     for (const category in buffsData) {
                         buffToActivate = buffsData[category].find(b => b.Name === buffNameToLoad);
                         if (buffToActivate) break;
                     }
                     if (buffToActivate) {
                         buffElement = buffGrid.querySelector(`.buff-icon[data-buff-name="${buffNameToLoad}"]`);
                         if(buffElement && !buffElement.classList.contains('active')) {
                             toggleBuff(buffToActivate, buffElement);
                         } else if (!buffElement) { console.warn(`Buff element missing for ${buffNameToLoad}`); }
                     } else { console.warn(`Buff data missing for ${buffNameToLoad}`); }
                 });
             } else { console.warn("Buff grid not populated, skipping buff load."); }
         } else {
              console.log("Skipping buff load (No saved buffs or buff data missing).");
              resetAllBuffs();
         }

        updateRemainingPoints();
        const loadedResults = recalculateBuildStats();
        updateDisplay(loadedResults);
        showNotification("Loaded saved build.", "success");

    } catch (e) {
        console.error("Failed to load or parse saved build:", e);
        localStorage.removeItem('fo2BuildTesterSave'); // Clear potentially corrupted data
        // Reset slider globals on error too
        performanceMinLevel = 1;
        performanceMaxLevel = 80; // Reset to placeholder
        // Optionally reset other parts of the state here?
        // resetStats(); resetAllEquipment(); resetAllBuffs();
    }
}

function calculatePerformance(dps, minLevel, maxLevel) {
    const performanceData = [];
    const hideBosses = hideBossesCheckbox ? hideBossesCheckbox.checked : false;

    if (!mobDataCache || dps <= 0) {
        return performanceData;
    }

    // Filter mobs by level range AND boss status (using name lookup) if checkbox is checked
    const filteredMobs = mobDataCache.filter(mob => {
        const levelMatch = mob.level >= minLevel && mob.level <= maxLevel;
        // NEW Check: Include the mob if:
        // 1. The checkbox is NOT checked OR
        // 2. The mob's name is NOT in the bossNameSet
        const bossMatch = !hideBosses || !bossNameSet.has(mob.name);
        return levelMatch && bossMatch;
    });

    // The rest of the function (calculating ttk, gph etc. for filteredMobs) remains the same...
    filteredMobs.forEach(mob => {
        if (mob.health <= 0) return;

        const timeToKill = mob.health / dps;
        let goldPerHour = 0;
        let xpPerHour = 0; 

        if (timeToKill > 0) {
            const killsPerHour = 3600 / timeToKill;
            goldPerHour = killsPerHour * mob.avgGoldPerKill;
            xpPerHour = killsPerHour * mob.xp; // Calculate faction XP per hour using mob.xp
        }

        performanceData.push({
            name: mob.name,
            level: mob.level,
            ttk: timeToKill,
            gph: goldPerHour,
            xph: xpPerHour
        });
    });

    return performanceData;
}

// Helper to format numbers nicely
function formatNumber(num) {
     if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
     if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
     if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
     return Math.round(num).toString(); // Round smaller numbers
 }


function updatePerformanceTable(performanceData) {
    const tbody = document.getElementById('performance-tbody');
    if (!tbody) return;
    tbody.innerHTML = ''; // Clear previous rows

    if (!performanceData || performanceData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No performance data to display (check DPS/Mob Data).</td></tr>';
        return;
    }

    // Sort the data
    performanceData.sort((a, b) => {
        let valA = a[performanceSortColumn];
        let valB = b[performanceSortColumn];

        // Handle string comparison for name
        if (performanceSortColumn === 'name') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
            return performanceSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            // Numeric comparison for other columns
            return performanceSortAsc ? valA - valB : valB - valA;
        }
    });

    // Update header indicators
    document.querySelectorAll('.performance-table th').forEach(th => {
        th.querySelector('.sort-indicator').className = 'sort-indicator'; // Clear previous indicators
        if (th.dataset.sort === performanceSortColumn) {
             th.querySelector('.sort-indicator').classList.add(performanceSortAsc ? 'asc' : 'desc');
        }
    });


    // Populate table
    performanceData.forEach(mobPerf => {
        const row = tbody.insertRow();
        row.insertCell().textContent = mobPerf.name;
        row.insertCell().textContent = mobPerf.level;
        const ttkCell = row.insertCell();
            if (mobPerf.ttk > 99) {
                const minutes = mobPerf.ttk / 60;
                ttkCell.textContent = minutes.toFixed(1) + 'm'; // e.g., "1.7m"
            } else {
                ttkCell.textContent = Math.round(mobPerf.ttk) + 's'; // e.g., "98s" or "99s"
            }
        row.insertCell().textContent = formatNumber(mobPerf.gph);    // Gold per hour
        row.insertCell().textContent = formatNumber(mobPerf.xph);    // XP per hour
    });
}

function setupLevelFilterSliders() {
    const minSlider = document.getElementById('mob-level-min-slider');
    const maxSlider = document.getElementById('mob-level-max-slider');
    const minDisplay = document.getElementById('min-level-display');
    const maxDisplay = document.getElementById('max-level-display');

    if (!minSlider || !maxSlider || !minDisplay || !maxDisplay) {
        console.error("Level filter slider elements not found!");
        return;
    }

    // 1. Set the MAX attribute based on actual data (actualMaxMobLevel is set in loadMobsData)
    minSlider.max = actualMaxMobLevel;
    maxSlider.max = actualMaxMobLevel;

    // 2. Clamp the loaded/default MIN level (using the global variable potentially set by loadCurrentStateFromLocalStorage)
    let initialMin = Math.min(performanceMinLevel, actualMaxMobLevel); // Can't exceed actual max
    initialMin = Math.max(1, initialMin); // Can't be less than 1
    minSlider.value = initialMin;
    performanceMinLevel = initialMin; // Update global variable AFTER clamping
    minDisplay.textContent = initialMin;

    // 3. Clamp the loaded/default MAX level (using the global variable potentially set by loadCurrentStateFromLocalStorage)
    let initialMax = Math.min(performanceMaxLevel, actualMaxMobLevel); // Can't exceed actual max
    initialMax = Math.max(1, initialMax); // Can't be less than 1
    // Ensure max is not less than the (potentially clamped) min
    initialMax = Math.max(initialMin, initialMax);
    maxSlider.value = initialMax;
    performanceMaxLevel = initialMax; // Update global variable AFTER clamping
    maxDisplay.textContent = initialMax;

    // --- Event Listeners ---
    minSlider.addEventListener('input', () => {
        let minVal = parseInt(minSlider.value);
        let maxVal = parseInt(maxSlider.value);

        // Prevent min from exceeding max
        if (minVal > maxVal) {
            minVal = maxVal;
            minSlider.value = minVal;
        }
        performanceMinLevel = minVal; // Update global variable
        minDisplay.textContent = minVal;

        // Trigger table update
        const currentDPS = parseFloat(document.getElementById('dps-display').textContent) || 0;
        const perfData = calculatePerformance(currentDPS, performanceMinLevel, performanceMaxLevel);
        updatePerformanceTable(perfData);
         saveCurrentStateToLocalStorage(); // Save state on slider change
    });

    maxSlider.addEventListener('input', () => {
        let minVal = parseInt(minSlider.value);
        let maxVal = parseInt(maxSlider.value);

        // Prevent max from going below min
        if (maxVal < minVal) {
            maxVal = minVal;
            maxSlider.value = maxVal;
        }
        performanceMaxLevel = maxVal; // Update global variable
        maxDisplay.textContent = maxVal;

        // Trigger table update
        const currentDPS = parseFloat(document.getElementById('dps-display').textContent) || 0;
        const perfData = calculatePerformance(currentDPS, performanceMinLevel, performanceMaxLevel);
        updatePerformanceTable(perfData);
         saveCurrentStateToLocalStorage(); // Save state on slider change
    });

    // --- Trigger initial table update (Ensures table populates on load) ---
    const initialDPS = parseFloat(document.getElementById('dps-display').textContent) || 0;
    const initialPerfData = calculatePerformance(initialDPS, performanceMinLevel, performanceMaxLevel);
    updatePerformanceTable(initialPerfData);
    // --- End initial update ---
}

// Add Event Listeners for Table Sorting
function addPerformanceTableSortListeners() {
    document.querySelectorAll('.performance-table th').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sort;
            if (performanceSortColumn === sortKey) {
                // Toggle direction if clicking the same column
                performanceSortAsc = !performanceSortAsc;
            } else {
                // Switch column, default to ascending
                performanceSortColumn = sortKey;
                performanceSortAsc = true;
            }

            // ---- CORRECTED PART ----
            // Get the CURRENT DPS from the display, just like the sliders do
            const currentDPS = parseFloat(document.getElementById('dps-display').textContent) || 0;
            // Calculate performance using the current DPS and levels
            const perfData = calculatePerformance(currentDPS, performanceMinLevel, performanceMaxLevel);
            // Update the table (this function already handles sorting based on the global variables)
            updatePerformanceTable(perfData);
            // ---- END OF CORRECTION ----
        });
    });
}

// --- Saved Build Management Functions ---

const SAVED_BUILDS_KEY = 'fo2BuildTesterBuildsList'; // Key for localStorage

// Generate a simple unique ID
function generateBuildId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Load saved builds from localStorage
function loadSavedBuilds() {
    const buildsString = localStorage.getItem(SAVED_BUILDS_KEY);
    savedBuilds = buildsString ? JSON.parse(buildsString) : [];
    console.log(`Loaded ${savedBuilds.length} saved builds.`);
}

// Save the entire list of builds to localStorage
function saveBuildsList() {
    try {
        localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(savedBuilds));
    } catch (e) {
        console.error("Failed to save builds list:", e);
        showNotification("Error saving builds list.", "error");
    }
}

function displaySavedBuilds() {
    const listContainer = document.getElementById('saved-builds-list');
    if (!listContainer) {
        console.error("Saved builds list container (#saved-builds-list) not found!");
        return;
    }
    listContainer.innerHTML = ''; // Clear current list

    if (!savedBuilds || savedBuilds.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; color: #aaa; font-size: 0.9em; padding: 10px;">No saved builds yet.</div>';
        return;
    }

    // Define the exact order of ALL equipment slots for the single 8x2 grid
    const allEquipmentSlots = [
        'face',    'head',     'shoulder', 'back',   // Row 1
        'legs',    'chest',    'weapon',   'offhand',
        'ring1',   'ring2',    'trinket1', 'trinket2', // Row 2
        'guild',   'faction',  '',         ''        // Empty strings for placeholders if needed
    ];


    // --- Tooltip Helper Function (Scoped within displaySavedBuilds) ---
    // Shows item details on hover for the compact equipment icons
    function showItemTooltipOnHover(element, item) {
         hideItemTooltip(); // Ensure no old tooltips linger
         if (!item) return;

         const tooltip = document.createElement('div');
         tooltip.className = 'item-tooltip';
         tooltip.id = 'item-tooltip'; // Use ID to easily find and remove

         // --- Full Tooltip Content Generation Logic ---
         // (This should be the same logic used in the main build editor tooltip)
         let content = `<div class="tooltip-title">${item.Name}</div>`;
         if (item.Level !== undefined) {
             const subtypeText = item.Subtype && item.Subtype.trim() !== '' ? ` ${item.Subtype}` : '';
             content += `<div class="tooltip-level">Level ${item.Level}${subtypeText}</div>`;
         }
         const allStatsHtml = [];
         const statsToCheck = ['STA', 'STR', 'INT', 'AGI', 'Armor'];
         const stringStatsToCheck = ['Damage'];
         const specialStatsToCheck = ['Atk Spd'];

         statsToCheck.forEach(statKey => {
             if (item.hasOwnProperty(statKey) && item[statKey] !== undefined && item[statKey] !== 0 && item[statKey] !== '') {
                 const value = item[statKey];
                 const sign = value > 0 ? '+' : '';
                 const cssClass = value > 0 ? 'stat-positive' : 'stat-negative';
                 allStatsHtml.push(`<div class="${cssClass}">${statKey}: ${sign}${value}</div>`);
             }
         });
         stringStatsToCheck.forEach(statKey => {
              if (item.hasOwnProperty(statKey) && item[statKey] !== undefined && item[statKey] !== '') {
                  allStatsHtml.push(`<div>${statKey}: ${item[statKey]}</div>`);
              }
         });
          specialStatsToCheck.forEach(statKey => {
              if (item.hasOwnProperty(statKey) && item[statKey] !== undefined && item[statKey] !== 0 && item[statKey] !== '') {
                   // Display speed in ms for consistency with item data, or convert to seconds
                   allStatsHtml.push(`<div>Speed: ${item[statKey]}</div>`);
                   // const speedInSeconds = (item[statKey] / 1000.0).toFixed(1);
                   // allStatsHtml.push(`<div>Speed: ${speedInSeconds}s</div>`);
              }
         });
         if (allStatsHtml.length > 0) {
             content += `<div class="tooltip-stats">${allStatsHtml.join('')}</div>`;
         }

         const requirements = [];
         ['Req STA', 'Req STR', 'Req INT', 'Req AGI'].forEach(reqKey => {
             const statName = reqKey.replace('Req ', '');
             if (item.hasOwnProperty(reqKey) && item[reqKey] !== undefined && item[reqKey] !== 0 && item[reqKey] !== '') {
                 requirements.push(`<div>Requires ${statName}: ${item[reqKey]}</div>`);
             }
         });
          if (requirements.length > 0) {
             // Add separator only if there were stats displayed before requirements
             if (allStatsHtml.length > 0) {
                 content += `<div style="border-top: 1px solid var(--border); margin: 5px 0;"></div>`;
             }
             content += `<div class="tooltip-req">${requirements.join('')}</div>`;
         }
         // --- End Full Tooltip Content ---

         tooltip.innerHTML = content;
         document.body.appendChild(tooltip);

         // Position Tooltip near the hovered element
         const elemRect = element.getBoundingClientRect();
         const tooltipRect = tooltip.getBoundingClientRect();
         const margin = 5; // Reduced margin slightly
         let left = elemRect.right + margin;
         let top = elemRect.top + window.scrollY; // Add scrollY for correct positioning

         // Adjust position if tooltip goes off-screen
         if (left + tooltipRect.width > window.innerWidth) {
             left = elemRect.left - tooltipRect.width - margin; // Move to left
         }
         if (top + tooltipRect.height > (window.innerHeight + window.scrollY)) {
             top = (window.innerHeight + window.scrollY) - tooltipRect.height - margin; // Align to bottom edge
         }
         if (top < window.scrollY) {
             top = window.scrollY + margin; // Align to top edge
         }
          // Ensure left doesn't go off-screen either
         if (left < window.scrollX) {
             left = window.scrollX + margin;
         }


         tooltip.style.left = `${left}px`;
         tooltip.style.top = `${top}px`;

         // Fade in effect
         requestAnimationFrame(() => {
             tooltip.style.opacity = 1;
         });
    }
    // --- End Tooltip Helper ---


    // --- Loop through saved builds ---
    savedBuilds.forEach(build => {
        // Calculate stats for the current build in the loop
        const calculatedStats = calculateStatsForSavedBuild(build);

        // Main container for the build item row
        const buildItem = document.createElement('div');
        buildItem.className = 'saved-build-item expanded';
        buildItem.dataset.buildId = build.id;

        // Wrapper for the 4 main content columns
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'build-item-content-wrapper';

        // --- Column 1: Info ---
        const infoDiv = document.createElement('div');
        infoDiv.className = 'build-item-info build-column';
        infoDiv.innerHTML = `
            <strong>${build.name || 'Unnamed Build'}</strong>
            <div class="build-item-details">
                By: ${build.creator || 'Unknown'} | Lvl: ${build.level}${ build.rebirth ?
                    ' <img src="Icons/rebirth-icon.png" alt="Rebirth" style="height: 1.1em; vertical-align: middle; margin-left: 3px;" title="Rebirth">'
                    : ''
                }
            </div>
            <div class="build-item-description">${build.description || 'No description.'}</div>
        `;
        infoDiv.addEventListener('click', () => handleLoadBuildClick(build.id)); // Click loads the build
        contentWrapper.appendChild(infoDiv);

        // --- Column 2: Calculated Stats ---
        const statsDiv = document.createElement('div');
        statsDiv.className = 'build-item-calculated-stats build-column';
        if (calculatedStats) {
            // Display calculated stats with colors and compact bars
            statsDiv.innerHTML = `
            <div class="build-item-resource-bars">
                    <div class="build-item-bar health-bar-small">HP: ${calculatedStats.finalHP}</div>
                    <div class="build-item-bar energy-bar-small">Energy: ${calculatedStats.finalEnergy}</div>
            </div>
            <div>
                    <span class="AGI">${calculatedStats.finalStats.agi}</span> /
                    <span class="STR">${calculatedStats.finalStats.str}</span> /
                    <span class="INT">${calculatedStats.finalStats.int}</span> /
                    <span class="STA">${calculatedStats.finalStats.sta}</span>
            </div>    
                <div><b>DPS:</b> ${Math.round(calculatedStats.finalDPS)}  <b>Armor:</b> ${calculatedStats.finalArmor}</div>
                <div><b>Crit:</b> ${calculatedStats.finalCrit.toFixed(2)}%  <b>Dodge:</b>${calculatedStats.finalDodge.toFixed(2)}%</div>
                <div><b>Dmg:</b> (${calculatedStats.finalMinDamage}-${calculatedStats.finalMaxDamage})  <b>Spd:</b>${(calculatedStats.finalAttackSpeed / 1000.0).toFixed(1)}s</div>
                <div><b>Mgtn:</b> ${Math.round(calculatedStats.mitigationPercent.toFixed(2))}%</div>
            <div><b>HP/s:</b> ${calculatedStats.finalHPRegenPerSecond.toFixed(1)}/s <b>ENG/s:</b> ${calculatedStats.finalEnergyRegenPerSecond.toFixed(1)}/s</div>
            `;
        } else {
            // Fallback if stats calculation fails
            statsDiv.innerHTML = '<div style="font-style: italic; color: #888;">Stats N/A</div>';
        }
        contentWrapper.appendChild(statsDiv);

        // --- Column 3: Equipment Grid (Single 8x2 Grid) ---
        const equipDiv = document.createElement('div');
        equipDiv.className = 'build-item-equip-section build-column';

        const singleGridDiv = document.createElement('div');
        singleGridDiv.className = 'build-item-equip-grid-single'; // Use the class for the 8x2 grid

        allEquipmentSlots.forEach(slotName => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'build-item-equip-slot'; // Use the class for the larger slot size
            let item = null; // Define item scope

            if (slotName && build.equipment && build.equipment[slotName]) {
                const itemId = build.equipment[slotName];
                item = itemsByIdMap.get(itemId); // Find the item object

                if (item && item["Sprite-Link"]) {
                    slotDiv.innerHTML = `<img src="${item["Sprite-Link"]}" alt="${item.Name || slotName}" title="${item.Name || slotName}">`;
                } else if (item) {
                    // Fallback if image link is missing but item exists
                    slotDiv.innerHTML = `<div class="build-item-equip-slot-text" title="${item.Name}">${item.Name.substring(0, 3)}</div>`;
                } else {
                    // Item ID exists but item not found in map (or slotName is empty)
                    slotDiv.classList.add('empty');
                }
            } else {
                // Slot is empty or placeholder in the layout
                slotDiv.classList.add('empty');
            }

            // Add tooltip listener only if there's an item to show info for
            if (item) {
                slotDiv.addEventListener('mouseenter', function() { showItemTooltipOnHover(slotDiv, item); });
                slotDiv.addEventListener('mouseleave', hideItemTooltip); // Assumes global hideItemTooltip exists
            }
            singleGridDiv.appendChild(slotDiv);
        });
        equipDiv.appendChild(singleGridDiv); // Add the single grid container to the equipment column
        contentWrapper.appendChild(equipDiv);

        // --- Column 4: Buffs ---
        const buffsDiv = document.createElement('div');
        buffsDiv.className = 'build-item-buffs-section build-column';
        if (build.activeBuffNames && build.activeBuffNames.length > 0) {
             build.activeBuffNames.forEach(buffName => {
                 let buff = null;
                 // Find buff object from buffsData (across categories)
                 for (const category in buffsData) {
                    if (buffsData.hasOwnProperty(category)) {
                       buff = buffsData[category].find(b => b.Name === buffName);
                       if (buff) break;
                    }
                 }

                 if (buff) {
                     const buffIconDiv = document.createElement('div');
                     buffIconDiv.className = 'build-item-buff-icon'; // Use class for larger buff icons
                     // Determine icon path (same logic as before)
                     const tierMatch = buff.Name.match(/\s(\d+)$/);
                     let baseName = buff.Name.toLowerCase().replace(/\s+\d+$/, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                     const iconFileName = `Icons/${baseName}-icon.png`; // Ensure Icons path is correct

                     buffIconDiv.innerHTML = `<img src="${iconFileName}" alt="${buff.Name}" title="${buff.Name}">`;
                     // Add buff tooltip listeners
                     buffIconDiv.addEventListener('mouseenter', function(e) { showBuffTooltip(buff, e.currentTarget); }); // Assumes global showBuffTooltip exists
                     buffIconDiv.addEventListener('mouseleave', hideBuffTooltip); // Assumes global hideBuffTooltip exists
                     buffsDiv.appendChild(buffIconDiv);
                 } else {
                     console.warn(`Buff data not found for "${buffName}" in saved build ${build.id}`);
                 }
             });
        } else {
            // Optional: display placeholder if no buffs
            // buffsDiv.innerHTML = '<div class="build-item-no-buffs" style="font-size: 0.8em; color: #888; text-align: center; width: 100%;">No buffs</div>';
        }
        contentWrapper.appendChild(buffsDiv);

        // --- Action Buttons Column ---
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'build-item-actions'; // Actions are now separate from the main content flex
        actionsDiv.innerHTML = `
            <button class="build-action-button duplicate" title="Duplicate Build">➕</button>
            <button class="build-action-button edit" title="Edit Details">✏️</button>
            <button class="build-action-button delete" title="Delete Build">❌</button>
        `;
        // Add event listeners for actions
        actionsDiv.querySelector('.duplicate').addEventListener('click', (e) => { e.stopPropagation(); handleDuplicateBuildClick(build.id); });
        actionsDiv.querySelector('.edit').addEventListener('click', (e) => { e.stopPropagation(); openBuildModal(build.id); });
        actionsDiv.querySelector('.delete').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteBuildClick(build.id); });

        // --- Append content wrapper and actions to the main build item ---
        buildItem.appendChild(contentWrapper);
        buildItem.appendChild(actionsDiv);

        // Add the fully constructed build item to the list
        listContainer.appendChild(buildItem);
    });
}

// Open the modal for saving a new build or editing an existing one
function openBuildModal(buildId = null) {
    const isEditing = buildId !== null;
    const build = isEditing ? savedBuilds.find(b => b.id === buildId) : null;

    modalBuildIdInput.value = buildId || ''; // Store ID if editing
    modalBuildNameInput.value = isEditing ? (build?.name || '') : '';
    modalBuildCreatorInput.value = isEditing ? (build?.creator || '') : '';
    modalBuildDescriptionInput.value = isEditing ? (build?.description || '') : '';
    document.getElementById('modal-title').textContent = isEditing ? 'Edit Build Details' : 'Save New Build';

    // Set up the save button action
    modalSaveButton.onclick = () => handleSaveBuildDetails(buildId); // Pass ID

    buildDetailsModal.style.display = 'flex'; // Show modal
    modalBuildNameInput.focus();
}

// Close the modal
function closeBuildModal() {
    buildDetailsModal.style.display = 'none';
}

 // Handle saving details from the modal (new or edit)
function handleSaveBuildDetails(buildId = null) {
   const name = modalBuildNameInput.value.trim() || 'Unnamed Build';
   const creator = modalBuildCreatorInput.value.trim();
   const description = modalBuildDescriptionInput.value.trim().substring(0, MAX_BUILD_DESCRIPTION_LENGTH);

   if (buildId) {
       // Editing existing build
       const buildIndex = savedBuilds.findIndex(b => b.id === buildId);
       if (buildIndex > -1) {
           savedBuilds[buildIndex].name = name;
           savedBuilds[buildIndex].creator = creator;
           savedBuilds[buildIndex].description = description;
           showNotification(`Build "${name}" details updated.`, 'success');
       } else {
            showNotification(`Error: Build with ID ${buildId} not found for editing.`, 'error');
            closeBuildModal();
            return;
       }
   } else {
        // Saving new build - Gather current state
        const newBuild = {
            id: generateBuildId(),
            name: name,
            creator: creator,
            description: description,
            level: currentStats.level,
            rebirth: currentStats.rebirth,
            stats: { ...currentStats.statPoints },
            equipment: {}, // Will be populated with IDs
            activeBuffNames: activeBuffs.map(b => b.Name),
            minFilterLevel: performanceMinLevel, // Save slider states too
            maxFilterLevel: performanceMaxLevel
        };

        // Populate equipment IDs
        for (const slot in currentStats.equipment) {
            if (currentStats.equipment[slot]) {
                const itemId = currentStats.equipment[slot]['Item ID'];
                if (itemId !== undefined) {
                    newBuild.equipment[slot] = itemId;
                }
            }
        }

        savedBuilds.push(newBuild);
        showNotification(`Build "${name}" saved.`, 'success');
   }

   saveBuildsList();
   displaySavedBuilds();
   closeBuildModal();
}


// Handle clicking the main "Save Current Build" button
function handleSaveCurrentBuildClick() {
   openBuildModal(); // Open modal to enter details for a NEW build
}


// Load a specific build when its button is clicked
function handleLoadBuildClick(buildId) {
    const buildToLoad = savedBuilds.find(b => b.id === buildId);
    if (!buildToLoad) {
        showNotification("Error: Could not find build to load.", "error");
        return;
    }

    console.log("Loading build:", buildToLoad.name);

    const editorButton = document.querySelector('.nav-button[data-page="build-editor"]');
         if (editorButton) {
             editorButton.click(); // Simulate click to switch page
         }

    // Apply Level & Rebirth
    currentStats.level = buildToLoad.level;
    currentStats.rebirth = buildToLoad.rebirth;
    levelInput.value = currentStats.level;
    levelSlider.value = currentStats.level;
    rebirthCheckbox.checked = currentStats.rebirth;
    // Update level slider/input max based on rebirth
    const maxLvl = currentStats.rebirth ? 80 : 60;
    levelSlider.max = maxLvl;
    levelInput.max = maxLvl;
    if (currentStats.level > maxLvl) { // Clamp level if needed
        currentStats.level = maxLvl;
        levelInput.value = maxLvl;
        levelSlider.value = maxLvl;
    }

    // Apply Stats
    currentStats.statPoints = { ...buildToLoad.stats };
    agiValue.value = currentStats.statPoints.agi;
    strValue.value = currentStats.statPoints.str;
    intValue.value = currentStats.statPoints.int;
    staValue.value = currentStats.statPoints.sta;

   // Apply slider levels
   performanceMinLevel = buildToLoad.minFilterLevel || 1;
   performanceMaxLevel = buildToLoad.maxFilterLevel || actualMaxMobLevel;
    // Re-setup sliders to apply loaded values and clamp them
    setupLevelFilterSliders();

    // Apply Equipment
    resetAllEquipment(); // Clear existing gear first
    if (buildToLoad.equipment && itemsByIdMap.size > 0) {
        for (const slot in buildToLoad.equipment) {
            const itemId = buildToLoad.equipment[slot];
            const item = itemsByIdMap.get(itemId);
            if (item) {
                equipItem(slot, item); // Use existing equip function
            } else {
               console.warn(`Item ID ${itemId} for slot ${slot} not found in map during load.`);
            }
        }
    }

    // Apply Buffs
    resetAllBuffs(); // Clear existing buffs
    if (buildToLoad.activeBuffNames && buffsData) {
       const buffGrid = document.getElementById('buff-grid');
        buildToLoad.activeBuffNames.forEach(buffName => {
            let buffToActivate = null;
            // Find buff in our loaded buffsData
            for(const category in buffsData) {
                buffToActivate = buffsData[category].find(b => b.Name === buffName);
                if (buffToActivate) break;
            }

            if (buffToActivate) {
                const buffElement = buffGrid.querySelector(`.buff-icon[data-buff-name="${buffName}"]`);
                if(buffElement) {
                    toggleBuff(buffToActivate, buffElement); // Use existing toggle function
                } else { console.warn(`Buff element not found for ${buffName}`); }
            } else { console.warn(`Buff data not found for ${buffName}`); }
        });
    }

    // Final updates
    updateRemainingPoints(); // Update point display
    const results = recalculateBuildStats(); // Recalculate derived stats
    updateDisplay(results); // Update the main display and performance table
    saveCurrentStateToLocalStorage(); // Save this loaded state as the current one for refresh persistence

    showNotification(`Loaded build: ${buildToLoad.name}`, 'success');
}

// Delete a build
function handleDeleteBuildClick(buildId) {
    const buildIndex = savedBuilds.findIndex(b => b.id === buildId);
    if (buildIndex > -1) {
        const buildName = savedBuilds[buildIndex].name;
        if (confirm(`Are you sure you want to delete the build "${buildName}"?`)) {
            savedBuilds.splice(buildIndex, 1); // Remove from array
            saveBuildsList(); // Save updated list
            displaySavedBuilds(); // Refresh display
            showNotification(`Build "${buildName}" deleted.`, 'info');
        }
    } else {
         showNotification("Error: Could not find build to delete.", "error");
    }
}

 // Duplicate a build
function handleDuplicateBuildClick(buildId) {
    const originalBuild = savedBuilds.find(b => b.id === buildId);
    if (originalBuild) {
        const newBuild = JSON.parse(JSON.stringify(originalBuild)); // Deep copy
        newBuild.id = generateBuildId(); // Assign a new unique ID
        newBuild.name = `${originalBuild.name} (Copy)`; // Append "(Copy)" to the name
        // Find insertion index to place copy after original
        const originalIndex = savedBuilds.findIndex(b => b.id === buildId);
        savedBuilds.splice(originalIndex + 1, 0, newBuild); // Insert copy after original

        saveBuildsList();
        displaySavedBuilds();
        showNotification(`Build "${originalBuild.name}" duplicated.`, 'success');
    } else {
        showNotification("Error: Could not find build to duplicate.", "error");
    }
}

    // --- Navigation ---
    function setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-button');
        const pages = document.querySelectorAll('.page');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetPageKey = button.dataset.page; // e.g., "build-editor"
                const targetPageId = `${targetPageKey}-page`; // e.g., "build-editor-page"
                console.log(`Navigating to: ${targetPageId}`); // Debug log

                // Update button active state
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update page visibility
                let foundPage = false;
                pages.forEach(page => {
                    if (page.id === targetPageId) {
                        page.classList.add('active');
                        foundPage = true;
                         console.log(`Showing page: ${page.id}`); // Debug log
                    } else {
                        page.classList.remove('active');
                    }
                });
                 if (!foundPage) {
                    console.error(`Target page with ID ${targetPageId} not found!`); // Debug log
                 }

                // Refresh saved builds list if switching to management view
                if (targetPageKey === 'build-management') {
                    displaySavedBuilds();
                }
            });
        });
    }