// ------------------------------------------------------------------
// config.js - Game constants and configuration
// ------------------------------------------------------------------

const FO2Config = {
    // Storage Keys
    STORAGE: {
        SAVED_BUILDS_KEY: 'fo2BuildTesterBuildsList',
        CURRENT_STATE_KEY: 'fo2BuildTesterState'
    },
    
    // UI Constants
    UI: {
        MAX_BUILD_DESCRIPTION_LENGTH: 100,
        NOTIFICATION_DURATION: 2000,
        MAX_ACTIVE_BUFFS: 5,
        
        // Move MODE inside the UI object
        MODE: {
            SANDBOX: 'sandbox',
            RESTRICTED: 'restricted'
        }
    },
    
    // Game Mechanics
    GAME: {
        BASE_STATS: {
            hp: 18,
            energy: 20,
            atkPower: 40,
            atkSpeed: 1400,
            critical: 6.43,
            dodge: 0.00,
            armor: 0,
            damage: { min: 7, max: 10 }
        },
        // Level caps
        LEVEL: {
            NORMAL_CAP: 60,
            REBIRTH_CAP: 91,
            BASE_STAT_POINTS: 20,
            INITIAL_POINTS: 2,
            POINTS_PER_LEVEL: 2,
            REBIRTH_BONUS_INTERVAL: 4
        },
        // Critical hit calculation
        CRITICAL: {
            BASE_GAIN_RATIO: 1/14,  // Gain from AGI/INT
            SOFT_CAP: 80,          // % where diminishing returns begin
            REDUCTION_FACTOR: 0.5  // Factor applied after soft cap
        },
        // Dodge calculation tiers
        DODGE: {
            TIER1_CAP: 160,
            TIER1_RATE: 0.25,
            TIER2_CAP: 320,
            TIER2_RATE: 0.125,
            TIER3_CAP: 640,
            TIER3_RATE: 0.0625,
            TIER4_RATE: 0.00625
        },
        // Health and Energy calculation
        RESOURCES: {
            BASE_HP_CONSTANT: 1080,
            BASE_ENERGY_CONSTANT: 1200,
            HP_PER_STA_POINT: 20,
            ENERGY_PER_INT_POINT: 15
        },
        // Armor and mitigation
        ARMOR: {
            ARMOR_PER_STR: 5,
            MITIGATION_K_BASE: 200,
            MITIGATION_K_LEVEL_FACTOR: 50
        },
        // Attack power calculation
        ATTACK_POWER: {
            STR_PRIMARY_BONUS: 3,
            OTHER_PRIMARY_BONUS: 2,
            STR_SECONDARY_BONUS: 1
        },
        // Damage calculation
        DAMAGE: {
            AP_SCALE_DIVISOR: 14,   // Divisor for AP to damage conversion
            MIN_ATTACK_SPEED: 100   // Minimum attack speed in ms
        },
        // Spells config
        SPELLS: {
            DAMAGE_CALCULATION: {
                // Used for calculating spell DPS from damage range and cast time
                CAST_TIME_BUFFER: 0 // No additional buffer for now
            }
        }
    },

    API: {
        BASE_URL: 'https://data.fantasyonline2.com/api/items',
        SPRITE_BASE_URL: 'https://art.fantasyonline2.com/textures/icons/items/',
        TIMEOUT: 30000, // 30 seconds
        RETRY_ATTEMPTS: 3
    },
    
    // Lists of boss mobs
    BOSS_NAMES: new Set([
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
};

// ------------------------------------------------------------------
// utils.js - General utility functions
// ------------------------------------------------------------------

const FO2Utils = {
    /**
     * Formats a number with K, M, B suffixes for large values
     * @param {number} num - The number to format
     * @returns {string} The formatted number
     */
    formatNumber(num) {
        if (num === null || num === undefined || !isFinite(num)) return "0";
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return Math.round(num).toString();
    },
    
    /**
     * Generates a simple unique ID (for saved builds)
     * @returns {string} A unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * Parses a damage string (e.g., "10-20", "5", "1K-2K")
     * @param {string} damageString - The damage string to parse
     * @returns {{minDamage: number, maxDamage: number}} The parsed min/max damage
     */
    parseDamageString(damageString) {
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
    },
    
    /**
     * Safe JSON parsing with error handling
     * @param {string} str - The JSON string to parse
     * @param {*} defaultValue - Default value if parsing fails
     * @returns {*} The parsed object or default value
     */
    safeJSONParse(str, defaultValue = null) {
        try {
            if (!str) return defaultValue;
            return JSON.parse(str);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return defaultValue;
        }
    },
    
    /**
     * Clamps a number between min and max values
     * @param {number} value - The value to clamp
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @returns {number} The clamped value
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    /**
     * Deep clones an object (handles arrays and standard objects)
     * @param {*} obj - The object to clone
     * @returns {*} A deep copy of the object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }
        
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = this.deepClone(obj[key]);
            }
        }
        
        return result;
    }
};

// ------------------------------------------------------------------
// dom-utils.js - DOM helper functions
// ------------------------------------------------------------------

const DOMUtils = {
    /**
     * Safely gets an element by ID with error handling
     * @param {string} id - The element ID
     * @returns {HTMLElement|null} The element or null
     */
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID "${id}" not found`);
        }
        return element;
    },
    
    /**
     * Creates an element with properties and children
     * @param {string} tag - Element tag name
     * @param {Object} props - Element properties
     * @param {Array} children - Child elements or text nodes
     * @returns {HTMLElement} The created element
     */
    createElement(tag, props = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set properties
        Object.entries(props).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else if (key === 'style') {
                Object.entries(value).forEach(([styleKey, styleValue]) => {
                    element.style[styleKey] = styleValue;
                });
            } else if (key === 'attributes') {
                Object.entries(value).forEach(([attrName, attrValue]) => {
                    element.setAttribute(attrName, attrValue);
                });
            } else if (key.startsWith('on') && typeof value === 'function') {
                // Handle event listeners
                const eventName = key.substring(2).toLowerCase();
                element.addEventListener(eventName, value);
            } else {
                element[key] = value;
            }
        });
        
        // Append children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    },
    
    /**
     * Clears all children from an element
     * @param {HTMLElement} element - The element to clear
     */
    clearElement(element) {
        if (!element) return;
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    
    /**
     * Shows a notification message
     * @param {string} message - The message to display
     * @param {'info'|'success'|'error'} type - The notification type
     * @param {number} duration - Duration to show in ms
     */
    showNotification(message, type = 'info', duration = FO2Config.UI.NOTIFICATION_DURATION) {
        const notification = this.getElement('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = 'notification ' + type;
        notification.style.display = 'block';
        
        // Clear any existing timeout
        if (notification._timeoutId) {
            clearTimeout(notification._timeoutId);
        }
        
        // Set new timeout
        notification._timeoutId = setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    },
    
    /**
     * Sets up a tabbed navigation system
     * @param {string} buttonSelector - Selector for tab buttons
     * @param {string} pageSelector - Selector for tab pages
     */
    setupTabbedNavigation(buttonSelector, pageSelector) {
        const buttons = document.querySelectorAll('.nav-button');
        const pages = document.querySelectorAll('.page');
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const target = button.dataset.page;
                console.log('Tab clicked:', target);
                const targetPage = document.getElementById(`${target}-page`);
                
                // Update active button
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active page
                pages.forEach(page => page.classList.remove('active'));
                if (targetPage) targetPage.classList.add('active');
                
                // Save the current page to state
                StateManager.setCurrentPage(target);
                console.log('setCurrentPage called with:', target);
            });
        });
    }
};

// ------------------------------------------------------------------
// event-system.js - Custom event system
// ------------------------------------------------------------------

const EventSystem = {
    _events: {},
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Function to call when event occurs
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventName, callback) {
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }
        
        this._events[eventName].push(callback);
        
        // Return unsubscribe function
        return () => {
            this._events[eventName] = this._events[eventName].filter(cb => cb !== callback);
        };
    },
    
    /**
     * Publish an event to all subscribers
     * @param {string} eventName - Name of the event
     * @param {*} data - Data to pass to subscribers
     */
    publish(eventName, data) {
        if (!this._events[eventName]) return;
        
        this._events[eventName].forEach(callback => {
            callback(data);
        });
    },
    
    /**
     * Remove all subscriptions for an event
     * @param {string} eventName - Name of the event
     */
    clear(eventName) {
        if (eventName) {
            this._events[eventName] = [];
        } else {
            this._events = {};
        }
    }
};

// ------------------------------------------------------------------
// ui-factory.js - UI component creation
// ------------------------------------------------------------------

const UIFactory = {
    /**
     * Creates an equipment slot element
     * @param {string} slotName - The name of the slot
     * @param {Object|null} item - The equipped item or null
     * @param {Function} clickHandler - Function to call on slot click
     * @returns {HTMLElement} The created slot element
     */
    createSlot(slotName, item, clickHandler) {
        const slotElement = DOMUtils.createElement('div', {
            className: 'slot',
            dataset: { slot: slotName },
            onclick: (e) => {
                // Only handle clicks on the slot itself, not on clear button
                if (!e.target.classList.contains('clear-slot')) {
                    clickHandler(e);
                }
            }
        });
        
        // Use the fixed updateSlotContent method to populate the slot
        this.updateSlotContent(slotElement, slotName, item);
        return slotElement;
    },
    
    /**
     * Updates the content of an equipment slot
     * @param {HTMLElement} slotElement - The slot element to update
     * @param {string} slotName - The name of the slot
     * @param {Object|null} item - The equipped item or null
     */
    updateSlotContent(slotElement, slotName, item) {
        DOMUtils.clearElement(slotElement);
        
        if (item) {
            // Item equipped - show item image or fallback
            if (item["Sprite-Link"]) {
                slotElement.innerHTML = `<img src="${item["Sprite-Link"]}" alt="${item.Name || slotName}" title="${item.Name || slotName}" style="image-rendering: pixelated;">`;
            } else {
                slotElement.innerHTML = `<div class="slot-text-fallback" title="${item.Name || ''}">${item.Name ? item.Name.substring(0, 3) : '?'}</div>`;
            }
            
            // Add clear button with fixed event handling
            const clearButton = DOMUtils.createElement('div', {
                className: 'clear-slot',
                textContent: 'x',
                title: 'Remove item'
            });
            
            // Add the event listener directly to the button
            clearButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent slot click event
                // Directly call StateManager to remove the item
                StateManager.equipItem(slotName, null);
                // Update the UI to reflect the change
                UIController.updateEquipmentSlots();
            });
            
            slotElement.appendChild(clearButton);
        } else {
            // No item - show default icon
            let iconName = slotName;
            if (slotName === 'ring1' || slotName === 'ring2') iconName = 'ring';
            if (slotName === 'trinket1' || slotName === 'trinket2') iconName = 'trinket';
            
            const defaultIcon = DOMUtils.createElement('img', {
                src: `assets/build-sandbox/icons/${iconName}-icon.png`,
                alt: slotName.charAt(0).toUpperCase() + slotName.slice(1),
                onerror: function() {
                    this.parentNode.innerHTML = `<div class="slot-text-fallback">${this.alt.substring(0, 3)}</div>`;
                }
            });
            
            slotElement.appendChild(defaultIcon);
        }
    },
    
    /**
     * Creates a buff icon element
     * @param {Object} buff - The buff data
     * @param {boolean} isActive - Whether the buff is active
     * @param {Function} toggleHandler - Function to call on toggle
     * @returns {HTMLElement} The created buff element
     */
    createBuffIcon(buff, isActive, toggleHandler) {
        const tierMatch = buff.Name.match(/\s(\d+)$/);
        const tier = tierMatch ? tierMatch[1] : null;
        
        let baseName = buff.Name.toLowerCase()
            .replace(/\s+\d+$/, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
        
        const iconFileName = `assets/build-sandbox/icons/${baseName}-icon.png`;
        
        const buffDiv = DOMUtils.createElement('div', {
            className: isActive ? 'buff-icon active' : 'buff-icon',
            dataset: {
                buffName: buff.Name,
                category: buff.Category
            },
            onclick: () => toggleHandler(buff),
            onmouseenter: (e) => this.showBuffTooltip(buff, e.currentTarget),
            onmouseleave: () => this.hideTooltip('buff-tooltip')
        });
        
        const imgElement = DOMUtils.createElement('img', {
            src: iconFileName,
            alt: buff.Name,
            onerror: function() {
                this.parentNode.innerHTML = '?';
                this.parentNode.title = buff.Name;
            }
        });
        
        buffDiv.appendChild(imgElement);
        
        if (tier) {
            const tierSpan = DOMUtils.createElement('span', {
                className: 'buff-tier',
                textContent: tier
            });
            
            buffDiv.appendChild(tierSpan);
        }
        
        return buffDiv;
    },

    /**
     * Creates a spell slot element
     */
    createSpellSlot(spell, clickHandler) {
        const spellSlot = DOMUtils.createElement('div', {
            className: 'spell-slot',
            onclick: (e) => {
                if (!e.target.classList.contains('spell-clear')) {
                    clickHandler(e);
                }
            }
        });
        
        this.updateSpellSlotContent(spellSlot, spell);
        return spellSlot;
    },
    
    /**
     * Updates spell slot content
     */
    updateSpellSlotContent(spellSlot, spell) {
        DOMUtils.clearElement(spellSlot);
        
        if (spell) {
            const spellIconName = spell.Name.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            
            const iconFileName = `assets/build-sandbox/icons/${spellIconName}-icon.png`;
            
            const img = DOMUtils.createElement('img', {
                src: iconFileName,
                alt: spell.Name,
                onerror: function() {
                    this.style.display = 'none';
                    const fallback = DOMUtils.createElement('div', {
                        className: 'spell-slot-fallback',
                        textContent: '⚡'
                    });
                    this.parentNode.appendChild(fallback);
                }
            });
            
            spellSlot.appendChild(img);
            
            const clearButton = DOMUtils.createElement('div', {
                className: 'spell-clear',
                textContent: '×',
                title: 'Remove spell'
            });
            
            clearButton.addEventListener('click', (e) => {
                e.stopPropagation();
                StateManager.setSelectedSpell(null);
                UIController.updateSpellDisplay();
            });
            
            spellSlot.appendChild(clearButton);
        } else {
            const defaultIcon = DOMUtils.createElement('div', {
                className: 'spell-slot-fallback',
                textContent: '⚡'
            });
            
            spellSlot.appendChild(defaultIcon);
        }
    },
    
    /**
     * Creates spell search result
     */
    createSpellSearchResult(spell, selectHandler) {
        const spellElement = DOMUtils.createElement('div', {
            className: 'spell-search-item',
            textContent: `${spell.Name} ${spell.tier}`,
            onclick: () => selectHandler(spell)
        });
        
        return spellElement;
    },
    
    /**
     * Generates spell tooltip content
     */
    generateSpellTooltipContent(spell) {
        const calculatedStats = StateManager.state.currentBuild.calculatedStats;
        const critPercent = calculatedStats?.finalCrit || 0;
        const dpsWithCrit = StatsCalculator.calculateSpellDpsWithCrit(spell, critPercent);
        
        let content = `<div class="tooltip-title">${spell.Name} (Tier ${spell.tier})</div>`;
        content += `<div class="tooltip-level">Level ${spell.levelRequired} Spell</div>`;
        
        const statsHtml = [];
        statsHtml.push(`<div>Damage: ${spell.minDamage}-${spell.maxDamage}</div>`);
        statsHtml.push(`<div>Cast Time: ${spell.castTime}s</div>`);
        statsHtml.push(`<div>Energy Cost: ${spell.energyCost}</div>`);
        if (spell.cooldown > 0) {
            statsHtml.push(`<div>Cooldown: ${spell.cooldown}s</div>`);
        }
        statsHtml.push(`<div class="effect-positive">DPS: ${dpsWithCrit}</div>`);
        statsHtml.push(`<div class="effect-negative">Energy/sec: ${spell.energyPerSecond}</div>`);
        
        content += `<div class="tooltip-stats">${statsHtml.join('')}</div>`;
        
        return content;
    },
    
    /**
     * Creates a tooltip and positions it
     * @param {HTMLElement} element - The element to attach to
     * @param {string} contentHtml - The HTML content
     * @param {string} tooltipId - The ID for the tooltip
     * @param {string} tooltipClass - The CSS class for the tooltip
     */
    createTooltip(element, contentHtml, tooltipId = 'item-tooltip', tooltipClass = 'item-tooltip') {
        this.hideTooltip(tooltipId);
        
        const tooltip = DOMUtils.createElement('div', {
            className: tooltipClass,
            id: tooltipId,
            innerHTML: contentHtml
        });
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const elemRect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const margin = 10;
        
        // Default position: right, vertical center
        let left = elemRect.right + margin;
        let top = elemRect.top + (elemRect.height / 2) - (tooltipRect.height / 2) + window.scrollY;
        
        // Adjust if off-screen
        if (left + tooltipRect.width > window.innerWidth - margin) {
            // Try left side instead
            left = elemRect.left - tooltipRect.width - margin;
            if (left < margin) left = margin;
        }
        
        if (top < window.scrollY + margin) {
            top = window.scrollY + margin;
        } else if (top + tooltipRect.height > window.innerHeight + window.scrollY - margin) {
            top = window.innerHeight + window.scrollY - tooltipRect.height - margin;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        
        // Fade in
        requestAnimationFrame(() => { tooltip.style.opacity = 1; });
        
        return tooltip;
    },
    
    /**
     * Hides a tooltip by ID
     * @param {string} tooltipId - The ID of the tooltip to hide
     */
    hideTooltip(tooltipId = 'item-tooltip') {
        const existingTooltip = document.getElementById(tooltipId);
        if (existingTooltip) {
            existingTooltip.remove();
        }
    },

    /**
     * Shows an item tooltip
     * @param {HTMLElement} element - The element to attach to
     * @param {Object} item - The item data
     */
    showItemTooltip(element, item) {
        if (!item) return;
        
        const content = this.generateItemTooltipContent(item);
        this.createTooltip(element, content, 'item-tooltip');
    },
    
    /**
     * Shows a buff tooltip
     * @param {Object} buff - The buff data
     * @param {HTMLElement} element - The element to attach to
     */
    showBuffTooltip(buff, element) {
        if (!buff) return;
        
        const content = this.generateBuffTooltipContent(buff);
        this.createTooltip(element, content, 'buff-tooltip', 'buff-tooltip');
    },
    
    /**
     * Generates item tooltip HTML content - UPDATED with new fields
     * @param {Object} item - The item data
     * @returns {string} HTML content for tooltip
     */
    generateItemTooltipContent(item) {
        let content = `<div class="tooltip-title">${item.Name}</div>`;
        
        if (item.Level !== undefined) {
            content += `<div class="tooltip-level">Level ${item.Level}${item.Subtype ? ` ${item.Subtype}` : ''}</div>`;
        }
        
        // Stats section - UPDATED to include new fields
        const statsHtml = [];
        ['STA', 'STR', 'INT', 'AGI', 'Armor'].forEach(stat => {
            if (item[stat]) {
                const value = item[stat];
                const cssClass = value > 0 ? 'stat-positive' : 'stat-negative';
                statsHtml.push(`<div class="${cssClass}">${stat}: ${value > 0 ? '+' : ''}${value}</div>`);
            }
        });
        
        // NEW: Add Direct Crit and Direct ATK Power to stats display
        if (item["Direct Crit"] && item["Direct Crit"] !== 0) {
            const value = item["Direct Crit"];
            const cssClass = value > 0 ? 'stat-positive' : 'stat-negative';
            statsHtml.push(`<div class="${cssClass}">Crit: ${value > 0 ? '+' : ''}${value}%</div>`);
        }
        
        if (item["Direct ATK Power"] && item["Direct ATK Power"] !== 0) {
            const value = item["Direct ATK Power"];
            const cssClass = value > 0 ? 'stat-positive' : 'stat-negative';
            statsHtml.push(`<div class="${cssClass}">Attack Power: ${value > 0 ? '+' : ''}${value}</div>`);
        }
        
        if (item.Damage) statsHtml.push(`<div>Damage: ${item.Damage}</div>`);
        if (item['Atk Spd']) statsHtml.push(`<div>Speed: ${item['Atk Spd']}</div>`);
        
        if (statsHtml.length > 0) {
            content += `<div class="tooltip-stats">${statsHtml.join('')}</div>`;
        }
        
        // Requirements section - don't show current stat values or special styling
        const reqHtml = [];
        ['Req STA', 'Req STR', 'Req INT', 'Req AGI'].forEach(req => {
            if (item[req]) {
                reqHtml.push(`<div>Requires ${req.replace('Req ', '')}: ${item[req]}</div>`);
            }
        });
        
        if (reqHtml.length > 0) {
            if (statsHtml.length > 0) content += `<div class="tooltip-separator"></div>`;
            content += `<div class="tooltip-req">${reqHtml.join('')}</div>`;
        }
        
        return content;
    },
    
    /**
     * Generates buff tooltip HTML content
     * @param {Object} buff - The buff data
     * @returns {string} HTML content for tooltip
     */
    generateBuffTooltipContent(buff) {
        let content = `<div class="tooltip-title">${buff.Name} (${buff.Category})</div>`;
        
        const effects = [];
        const statMappings = [
            { key: "ATK Power", label: "ATK Power" },
            { key: "Crit %", label: "Crit", unit: "%" },
            { key: "ATK Speed", label: "ATK Speed" },
            { key: "Energy Per Second", label: "Energy Per Sec" },
            { key: "Health Per Second", label: "Health Per Sec" },
            { key: "Armor", label: "Armor" },
            { key: "STR", label: "STR" },
            { key: "STA", label: "STA" },
            { key: "AGI", label: "AGI" },
            { key: "INT", label: "INT" }
        ];
        
        statMappings.forEach(mapping => {
            const value = buff[mapping.key];
            if (value !== undefined && value !== null && value !== 0 && value !== "") {
                const sign = value > 0 ? '+' : '';
                const cssClass = (mapping.key === "ATK Speed") 
                    ? (value < 0 ? 'effect-positive' : 'effect-negative') 
                    : (value > 0 ? 'effect-positive' : 'effect-negative');
                    
                effects.push(`<div class="buff-effect ${cssClass}">${mapping.label}: ${sign}${value}${mapping.unit || ''}</div>`);
            }
        });
        
        content += effects.join('');
        return content;
    },
    
    /**
     * Creates a saved build item for the list
     * @param {Object} build - The build data
     * @param {Object} calculatedStats - Calculated statistics for the build
     * @param {Object} dataContext - Data needed to display the build
     * @returns {HTMLElement} The created build element
     */
    createSavedBuildItem(build, calculatedStats, dataContext) {
        const { itemsById, buffs } = dataContext;
        
        // Main container
        const buildItem = DOMUtils.createElement('div', {
            className: 'saved-build-item expanded',
            dataset: { buildId: build.id }
        });
        
        // Content wrapper (4 main columns)
        const contentWrapper = DOMUtils.createElement('div', {
            className: 'build-item-content-wrapper'
        });
        
        // Column 1: Info
        const infoDiv = DOMUtils.createElement('div', {
            className: 'build-item-info build-column',
            onclick: () => EventSystem.publish('load-build', { buildId: build.id })
        }, [
            DOMUtils.createElement('strong', {}, [build.name || 'Unnamed Build']),
            DOMUtils.createElement('div', { className: 'build-item-details' }, [
                `By: ${build.creator || 'Unknown'} | Lvl: ${build.level}`,
                build.rebirth ? DOMUtils.createElement('img', {
                    src: 'assets/build-sandbox/icons/rebirth-icon.png',
                    className: 'rebirth-inline-icon',
                    alt: 'R',
                    title: 'Rebirth'
                }) : null
            ].filter(Boolean)),
            DOMUtils.createElement('div', {
                className: 'build-item-description'
            }, [build.description || 'No description.'])
        ]);
        
        // Column 2: Calculated Stats
        const statsDiv = DOMUtils.createElement('div', {
            className: 'build-item-calculated-stats build-column'
        });
        
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
        
        // Column 3: Equipment Grid
        const equipDiv = DOMUtils.createElement('div', {
            className: 'build-item-equip-section build-column'
        });
        
        const equipGrid = DOMUtils.createElement('div', {
            className: 'build-item-equip-grid-single'
        });
        
        // Slot layout matching the editor's layout
        const allEquipmentSlotsLayout = [
            'face', 'head', 'shoulder', 'back', 'legs', 'chest', 'weapon', 'offhand',
            'ring1', 'ring2', 'trinket1', 'trinket2', 'guild', 'faction', '', ''
        ];
        
        allEquipmentSlotsLayout.forEach(slotName => {
            const slotDiv = DOMUtils.createElement('div', {
                className: slotName ? 'build-item-equip-slot' : 'build-item-equip-slot empty'
            });
            
            let item = null;
            if (slotName && build.equipment?.[slotName]) {
                item = itemsById.get(build.equipment[slotName]);
            }
            
            if (item && item["Sprite-Link"]) {
                slotDiv.innerHTML = `<img src="${item["Sprite-Link"]}" alt="${item.Name || slotName}" title="${item.Name || slotName}" style="image-rendering: pixelated;">`;
            } else if (item) {
                slotDiv.innerHTML = `<div class="build-item-equip-slot-text" title="${item.Name}">${item.Name.substring(0, 3)}</div>`;
            } else {
                slotDiv.classList.add('empty');
            }
            
            if (item) {
                slotDiv.addEventListener('mouseenter', function() {
                    UIFactory.showItemTooltip(slotDiv, item);
                });
                slotDiv.addEventListener('mouseleave', function() {
                    UIFactory.hideTooltip('item-tooltip');
                });
            }
            
            equipGrid.appendChild(slotDiv);
        });
        
        equipDiv.appendChild(equipGrid);

        // Column 4: Buffs
        const buffsDiv = DOMUtils.createElement('div', {
            className: 'build-item-buffs-section build-column'
        });
        
        if (build.activeBuffNames?.length > 0) {
            build.activeBuffNames.forEach(buffName => {
                let buff = null;
                for (const cat in buffs) {
                    buff = buffs[cat]?.find(b => b.Name === buffName);
                    if (buff) break;
                }
                
                if (buff) {
                    const buffIconDiv = DOMUtils.createElement('div', {
                        className: 'build-item-buff-icon'
                    });
                    
                    // Extract tier number if present (same logic as in createBuffIcon)
                    const tierMatch = buff.Name.match(/\s(\d+)$/);
                    const tier = tierMatch ? tierMatch[1] : null;
                    
                    // Create base name for icon (same as in createBuffIcon)
                    const baseName = buff.Name.toLowerCase()
                        .replace(/\s+\d+$/, '')
                        .replace(/[^a-z0-9\s-]/g, '')
                        .trim()
                        .replace(/\s+/g, '-');
                    
                    const iconFileName = `assets/build-sandbox/icons/${baseName}-icon.png`;
                    
                    // Create the image element
                    const img = DOMUtils.createElement('img', {
                        src: iconFileName,
                        alt: buff.Name,
                        title: buff.Name,
                        onerror: function() { buffIconDiv.innerHTML = '?'; }
                    });
                    
                    buffIconDiv.appendChild(img);
                    
                    // Add tier number indicator if present
                    if (tier) {
                        const tierSpan = DOMUtils.createElement('span', {
                            className: 'buff-tier',
                            textContent: tier
                        });
                        
                        buffIconDiv.appendChild(tierSpan);
                    }
                    
                    // Add event listeners for tooltip
                    buffIconDiv.addEventListener('mouseenter', (e) => UIFactory.showBuffTooltip(buff, e.currentTarget));
                    buffIconDiv.addEventListener('mouseleave', () => UIFactory.hideTooltip('buff-tooltip'));
                    
                    buffsDiv.appendChild(buffIconDiv);
                }
            });
        } else {
            buffsDiv.innerHTML = '<div class="build-item-no-buffs">No buffs</div>';
        }
        
        // Add the four columns to content wrapper
        contentWrapper.appendChild(infoDiv);
        contentWrapper.appendChild(statsDiv);
        contentWrapper.appendChild(equipDiv);
        contentWrapper.appendChild(buffsDiv);
        
        // Action buttons container
        const actionsDiv = DOMUtils.createElement('div', {
            className: 'build-item-actions'
        }, [
            DOMUtils.createElement('button', {
                className: 'build-action-button duplicate',
                title: 'Duplicate Build',
                textContent: '➕',
                onclick: (e) => {
                    e.stopPropagation();
                    EventSystem.publish('duplicate-build', { buildId: build.id });
                }
            }),
            DOMUtils.createElement('button', {
                className: 'build-action-button edit',
                title: 'Edit Details',
                textContent: '✏️',
                onclick: (e) => {
                    e.stopPropagation();
                    EventSystem.publish('edit-build', { buildId: build.id });
                }
            }),
            DOMUtils.createElement('button', {
                className: 'build-action-button delete',
                title: 'Delete Build',
                textContent: '❌',
                onclick: (e) => {
                    e.stopPropagation();
                    EventSystem.publish('delete-build', { buildId: build.id });
                }
            })
        ]);
        
        buildItem.appendChild(contentWrapper);
        buildItem.appendChild(actionsDiv);
        
        return buildItem;
    },
    
    /**
     * Creates a search result item for item search modal
     * @param {Object} item - The item data
     * @param {Function} selectHandler - Function to call when item is selected
     * @returns {HTMLElement} The created search result item
     */
    createSearchResultItem(item, selectHandler) {
        const itemElement = DOMUtils.createElement('div', {
            className: 'search-item',
            textContent: `(Lvl ${item.Level || '?'}) ${item.Name}`,
            title: `AGI:${item.AGI || 0} STR:${item.STR || 0} INT:${item.INT || 0} STA:${item.STA || 0} Armor:${item.Armor || 0}`,
            onclick: () => selectHandler(item)
        });
        
        // Add requirements info if any
        const hasRequirements = (
            (item['Req STR'] && item['Req STR'] > 0) ||
            (item['Req INT'] && item['Req INT'] > 0) ||
            (item['Req AGI'] && item['Req AGI'] > 0) ||
            (item['Req STA'] && item['Req STA'] > 0)
        );
        
        if (hasRequirements) {
            const requirementsSpan = DOMUtils.createElement('span', {
                className: 'item-requirements',
                textContent: ` (Req: ${item['Req STR'] ? 'STR:'+item['Req STR']+' ' : ''}${item['Req INT'] ? 'INT:'+item['Req INT']+' ' : ''}${item['Req AGI'] ? 'AGI:'+item['Req AGI']+' ' : ''}${item['Req STA'] ? 'STA:'+item['Req STA'] : ''})`.trim()
            });
            
            itemElement.appendChild(requirementsSpan);
        }
        
        return itemElement;
    },
    
    /**
     * Creates a grid item for the item dictionary
     * @param {Object} item - The item data
     * @param {Function} clickHandler - Function to call when clicked
     * @returns {HTMLElement} The created grid item
     */
    createItemGridIcon(item, clickHandler) {
        const iconDiv = DOMUtils.createElement('div', {
            className: 'grid-item-icon',
            dataset: { itemId: item['Item ID'] },
            onclick: () => clickHandler(item),
            onmouseenter: (e) => UIFactory.showItemTooltip(e.currentTarget, item),
            onmouseleave: () => UIFactory.hideTooltip('item-tooltip')
        });
        
        if (item['Sprite-Link']) {
            const img = DOMUtils.createElement('img', {
                src: item['Sprite-Link'],
                alt: item.Name,
                style: 'image-rendering: pixelated;',
                onerror: () => {
                    iconDiv.innerHTML = '?';
                    iconDiv.title = `${item.Name} (Image Error)`;
                }
            });
            
            iconDiv.appendChild(img);
        } else {
            iconDiv.textContent = '?';
            iconDiv.title = item.Name;
        }
        
        return iconDiv;
    },
    
    /**
     * Creates detailed item view for the dictionary - UPDATED with new fields
     * @param {Object} item - The item data
     * @returns {HTMLElement} The created item view
     */
    createItemDetailView(item) {
        const container = document.createElement('div');
        
        if (!item) {
            container.innerHTML = '<p class="empty-message">Select an item.</p>';
            return container;
        }
        
        let content = '';
        if (item['Sprite-Link']) {
            content += `<div class="viewer-image"><img src="${item['Sprite-Link']}" alt="${item.Name}" style="image-rendering: pixelated;"></div>`;
        }
        
        content += `<h4 class="viewer-title">${item.Name}</h4>`;
        content += `<div class="viewer-level-type">Level ${item.Level || 0} - ${item.Type || ''}${item.Subtype ? ` / ${item.Subtype}` : ''}</div>`;
        
        // Stats section - UPDATED to include new fields
        const statsHtml = [];
        const statMappings = [
            { key: 'STA', label: 'STA', classPositive: 'stat-positive', classNegative: 'stat-negative' },
            { key: 'STR', label: 'STR', classPositive: 'stat-positive', classNegative: 'stat-negative' },
            { key: 'INT', label: 'INT', classPositive: 'stat-positive', classNegative: 'stat-negative' },
            { key: 'AGI', label: 'AGI', classPositive: 'stat-positive', classNegative: 'stat-negative' },
            { key: 'Armor', label: 'Armor', classPositive: 'stat-positive', classNegative: 'stat-negative' },
            { key: 'Direct Crit', label: 'Crit (%)', classPositive: 'stat-positive', classNegative: 'stat-negative' }, // NEW
            { key: 'Direct ATK Power', label: 'Direct ATK Power', classPositive: 'stat-positive', classNegative: 'stat-negative' }, // NEW
            { key: 'Damage', label: 'Damage', classPositive: '', classNegative: '' },
            { key: 'Atk Spd', label: 'Speed (ms)', classPositive: '', classNegative: '' }
        ];
        
        statMappings.forEach(mapping => {
            if (item.hasOwnProperty(mapping.key) && item[mapping.key] !== undefined && item[mapping.key] !== '' && item[mapping.key] !== 0) {
                const value = item[mapping.key];
                let displayValue = value;
                let cssClass = '';
                
                if (typeof value === 'number') {
                    cssClass = value > 0 ? mapping.classPositive : mapping.classNegative;
                    displayValue = `${value > 0 ? '+' : ''}${value}`;
                }
                
                statsHtml.push(`<div class="viewer-stat-line"><span class="viewer-stat-label">${mapping.label}:</span> <span class="${cssClass}">${displayValue}</span></div>`);
            }
        });
        
        if (statsHtml.length > 0) {
            content += `<h5>Stats</h5><div class="viewer-stats">${statsHtml.join('')}</div>`;
        }
        
        // Requirements section
        const reqHtml = [];
        ['Req STA', 'Req STR', 'Req INT', 'Req AGI'].forEach(req => {
            if (item.hasOwnProperty(req) && item[req] !== undefined && item[req] !== 0 && item[req] !== '') {
                reqHtml.push(`<div class="viewer-req-line">Requires ${req.replace('Req ', '')}: ${item[req]}</div>`);
            }
        });
        
        if (reqHtml.length > 0) {
            content += `<h5>Requirements</h5><div class="viewer-reqs">${reqHtml.join('')}</div>`;
        }
        
        container.innerHTML = content;
        return container;
    },

    /**
     * Creates a simple set button
     * @param {Object} setData - Set data
     * @param {Function} equipHandler - Function to call when equipping set
     * @returns {HTMLElement} Set button element
     */
    createSetItem(setData, equipHandler) {
        const setButton = DOMUtils.createElement('button', {
            className: 'set-button action-button',
            textContent: setData.setName,
            title: `Click to equip ${setData.setName} set (${setData.items.length} pieces)`,
            onclick: () => equipHandler(setData)
        });
        
        return setButton;
    },

    /**
     * Creates a set bonus display element - FIXED to only show active bonuses
     * @param {string} setName - Name of the set
     * @param {number} equippedCount - Number of equipped pieces
     * @param {Object} setData - Set data
     * @returns {HTMLElement} Set bonus display element
     */
    createSetBonusDisplay(setName, equippedCount, setData) {
        const container = DOMUtils.createElement('div', {
            className: 'set-bonus-item'
        });
        
        // Find the maximum bonus tier possible for this set
        const maxPieces = Math.max(...Object.keys(setData.bonuses).map(tier => parseInt(tier)));
        
        const header = DOMUtils.createElement('div', {
            className: 'set-bonus-header',
            innerHTML: `<strong>${setName}</strong> (${maxPieces} pieces MAX)`
        });
        
        container.appendChild(header);
        
        // Find the highest applicable bonus tier
        const availableTiers = Object.keys(setData.bonuses)
            .map(tier => parseInt(tier))
            .filter(tier => tier <= equippedCount)
            .sort((a, b) => b - a); // Sort descending to get highest first
        
        if (availableTiers.length > 0) {
            const applicableTier = availableTiers[0];
            const bonus = setData.bonuses[applicableTier.toString()];
            
            const bonusList = DOMUtils.createElement('div', {
                className: 'set-bonus-list'
            });
            
            const tierDiv = DOMUtils.createElement('div', {
                className: 'set-bonus-tier active'
            });
            
            // Create the bonus text showing only non-zero values
            const bonusText = Object.entries(bonus)
                .filter(([stat, value]) => value !== 0)
                .map(([stat, value]) => `${stat}: +${value}`)
                .join(', ');
            
            tierDiv.innerHTML = `${applicableTier} pieces: ${bonusText}`;
            bonusList.appendChild(tierDiv);
            container.appendChild(bonusList);
        } else {
            // No bonuses active
            const noBonusDiv = DOMUtils.createElement('div', {
                className: 'set-bonus-tier inactive',
                textContent: 'No bonuses active'
            });
            container.appendChild(noBonusDiv);
        }
        
        return container;
    },
};

const ItemDictionaryEnhancements = {
    addExportImportButtons() {
        const filtersPanel = DOMUtils.getElement('item-dictionary-page')?.querySelector('.item-filters-panel');
        if (!filtersPanel) return;

        const exportImportSection = DOMUtils.createElement('div', {
            className: 'filter-section export-import-section'
        });

        const title = DOMUtils.createElement('h3', {
            textContent: 'Data Management',
            style: { marginBottom: '10px' }
        });

        const exportAllButton = DOMUtils.createElement('button', {
            textContent: 'Export json',
            className: 'action-button',
            style: { width: '100%', marginBottom: '5px' },
            onclick: ItemEditor.exportAllItems
        });

        const importButton = DOMUtils.createElement('button', {
            textContent: 'Import json',
            className: 'action-button',
            style: { width: '100%' },
            onclick: ItemEditor.importItems
        });

        exportImportSection.appendChild(title);
        exportImportSection.appendChild(exportAllButton);
        exportImportSection.appendChild(importButton);
        
        filtersPanel.appendChild(exportImportSection);
    }
};

// ------------------------------------------------------------------
// data-service.js - Data processing service
// ------------------------------------------------------------------

const DataService = {
    processItemData(itemArray) {
        try {
            if (!itemArray || !Array.isArray(itemArray) || itemArray.length === 0) {
                DOMUtils.showNotification("No item data loaded or data is invalid.", "error");
                console.warn("No item data provided or data is not an array.");
                return {
                    items: {
                        weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
                        equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
                    },
                    itemsById: new Map()
                };
            }
            
            const categorizedItems = {
                weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
                equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
            };
            
            const itemsById = new Map();
            
            itemArray.forEach(item => {
                // Sanitize and parse numeric fields
                if (item.Level !== undefined) item.Level = parseInt(item.Level) || 0;
                if (item.Armor !== undefined && item.Armor !== "") item.Armor = parseInt(item.Armor) || 0; else item.Armor = 0;
                if (item["Atk Spd"] !== undefined && item["Atk Spd"] !== "") item["Atk Spd"] = parseInt(item["Atk Spd"]) || 0; else item["Atk Spd"] = 0;
                
                // Parse new fields - Direct Crit and Direct ATK Power
                if (item["Direct Crit"] !== undefined && item["Direct Crit"] !== "") {
                    item["Direct Crit"] = parseFloat(item["Direct Crit"]) || 0;
                } else {
                    item["Direct Crit"] = 0;
                }
                
                if (item["Direct ATK Power"] !== undefined && item["Direct ATK Power"] !== "") {
                    item["Direct ATK Power"] = parseInt(item["Direct ATK Power"]) || 0;
                } else {
                    item["Direct ATK Power"] = 0;
                }
                
                ["STA", "STR", "INT", "AGI", "Req STA", "Req STR", "Req INT", "Req AGI"].forEach(stat => {
                    item[stat] = parseInt(item[stat]) || 0;
                });
                
                // Process damage string
                const damageValues = FO2Utils.parseDamageString(item.Damage);
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
                    itemsById.set(item['Item ID'], item);
                }
            });
            
            // Sort items within each subtype by level
            for (const type in categorizedItems) {
                for (const subtype in categorizedItems[type]) {
                    categorizedItems[type][subtype].sort((a, b) => (a.Level || 0) - (b.Level || 0));
                }
            }
            
            console.log(`Item data processed. ${itemsById.size} items mapped by ID.`);
            DOMUtils.showNotification(`Successfully processed ${itemArray.length} items.`, 'success');
            
            return { items: categorizedItems, itemsById };
        } catch (error) {
            console.error("Error processing item data:", error);
            DOMUtils.showNotification("Error processing item data. Check console.", "error");
            
            return {
                items: {
                    weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
                    equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
                },
                itemsById: new Map()
            };
        }
    },

    /**
 * Fetch all items from the FO2 API
 * @returns {Object} Processed items data
 */
async fetchItemsFromAPI() {
    try {
        console.log("Fetching items from FO2 API...");
        
        // Generate ID list for all items (1-2000 to be safe)
        const maxId = 2000;
        const idList = Array.from({length: maxId}, (_, i) => i + 1).join(',');
        
        const response = await fetch(`https://data.fantasyonline2.com/api/items?ids=${idList}`);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const apiData = await response.json();
        
        // Filter out null/undefined items and only keep items we can categorize
        const validItems = Object.entries(apiData)
            .filter(([id, itemData]) => itemData && this.canCategorizeItem(itemData))
            .reduce((obj, [id, itemData]) => {
                obj[id] = itemData;
                return obj;
            }, {});
        
        console.log(`Found ${Object.keys(validItems).length} valid items out of ${Object.keys(apiData).length} total`);
        
        // Convert API format to our internal format
        const convertedItems = this.convertAPIItemsToInternalFormat(validItems);
        
        // Process the converted items
        const processedData = this.processAPIItemData(convertedItems);
        
        console.log(`Loaded ${processedData.itemsById.size} items from API`);
        return processedData;
        
    } catch (error) {
        console.error("Error fetching items from API:", error);
        throw new Error(`Failed to fetch items from API: ${error.message}`);
    }
},

/**
 * Check if an item can be categorized
 * @param {Object} itemData - API item data
 * @returns {boolean} Whether item can be categorized
 */
canCategorizeItem(itemData) {
    const typeKey = `${itemData.ty},${itemData.st}`;
    const typeMapping = {
        // Equipment (Type 3)
        '3,0': true,  // Head
        '3,1': true,  // Trinkets
        '3,2': true,  // Face
        '3,4': true,  // Back
        '3,6': true,  // Shoulders  
        '3,8': true,  // Chest
        '3,10': true, // Legs
        '3,12': true, // Rings
        '3,13': true, // Faction
        '3,15': true, // Guild
        '3,17': true, // Offhand
        
        // Weapons (Type 2)
        '2,1': true,  // 1h Sword
        '2,2': true,  // 2h Bow
        '2,3': true,  // 1h Wand
        '2,4': true,  // 1h Axe
        '2,5': true,  // 2h Hammer
        '2,6': true,  // 2h Staff
        '2,9': true,  // 2h Sword
        '2,10': true,  // 2h Axe
        '2,12': true, // 2h Spear
        '2,13': true, // 1h Hammer
        '2,14': true  // 2h Hammer
    };
    
    // Check if item type is valid
    if (!typeMapping.hasOwnProperty(typeKey)) {
        return false;
    }
    
    // Check if item has a name and exclude UNUSED items
    const itemName = itemData.t?.en?.n || '';
    if (itemName.includes('(UNUSED)')) {
        return false;
    }
    
    return true;
},

/**
 * Convert API item format to our internal format
 * @param {Object} apiData - Raw API response
 * @returns {Array} Array of items in our format
 */
convertAPIItemsToInternalFormat(apiData) {
    const items = [];
    
    // Map API ty,st combinations to our categories
    const typeMapping = {
        // Equipment (Type 3)
        '3,0': { Type: 'equipment', Subtype: 'head' },
        '3,1': { Type: 'equipment', Subtype: 'trinket' },
        '3,2': { Type: 'equipment', Subtype: 'face' },
        '3,4': { Type: 'equipment', Subtype: 'back' },
        '3,6': { Type: 'equipment', Subtype: 'shoulder' },
        '3,8': { Type: 'equipment', Subtype: 'chest' },
        '3,10': { Type: 'equipment', Subtype: 'legs' },
        '3,12': { Type: 'equipment', Subtype: 'ring' },
        '3,13': { Type: 'equipment', Subtype: 'faction' },
        '3,15': { Type: 'equipment', Subtype: 'guild' },
        '3,17': { Type: 'equipment', Subtype: 'offhand' },
        
        // Weapons (Type 2)
        '2,1': { Type: 'weapon', Subtype: 'sword' },
        '2,2': { Type: 'weapon', Subtype: 'bow' },
        '2,3': { Type: 'weapon', Subtype: 'wand' },
        '2,4': { Type: 'weapon', Subtype: 'axe' },
        '2,5': { Type: 'weapon', Subtype: 'hammer' },
        '2,6': { Type: 'weapon', Subtype: 'staff' },
        '2,9': { Type: 'weapon', Subtype: 'sword' },
        '2,10': { Type: 'weapon', Subtype: 'axe' },
        '2,12': { Type: 'weapon', Subtype: 'bow' },
        '2,13': { Type: 'weapon', Subtype: 'hammer' },
        '2,14': { Type: 'weapon', Subtype: 'hammer' }
    };
    
    // Process each item in the API response
    for (const [itemId, itemData] of Object.entries(apiData)) {
        const typeKey = `${itemData.ty},${itemData.st}`;
        const typeInfo = typeMapping[typeKey];
        
        // Skip items we don't have mappings for
        if (!typeInfo) {
            continue;
        }
        
        // Convert API format to our internal format
        const convertedItem = {
            'Item ID': itemId,
            'Name': itemData.t?.en?.n || `Item ${itemId}`,
            'Level': itemData.lr || 0,
            'Type': typeInfo.Type,
            'Subtype': typeInfo.Subtype,
            
            // Stats from API - handle missing values as 0
            'STA': this.getStatValue(itemData.sta, 'sta') || 0,
            'STR': this.getStatValue(itemData.sta, 'str') || 0,
            'INT': this.getStatValue(itemData.sta, 'int') || 0,
            'AGI': this.getStatValue(itemData.sta, 'agi') || 0,
            
            // Requirements from API - handle missing values as 0
            'Req STA': this.getStatValue(itemData.sr, 'sta') || 0,
            'Req STR': this.getStatValue(itemData.sr, 'str') || 0,
            'Req INT': this.getStatValue(itemData.sr, 'int') || 0,
            'Req AGI': this.getStatValue(itemData.sr, 'agi') || 0,
            
            // Other properties - BE MORE CAREFUL HERE
            'Armor': itemData.sta?.arm || 0,
            
            // FIXED: Only set Direct Crit if it actually exists and is meaningful
            'Direct Crit': (itemData.sta?.crit && itemData.sta.crit > 0) ? itemData.sta.crit : 0,
            
            // FIXED: Use correct API field - atkp is Direct ATK Power, not atkr
            'Direct ATK Power': itemData.sta?.atkp || 0,
            
            // Attack Speed - only for weapons
            'Atk Spd': this.getAttackSpeed(itemData, typeInfo),
            
            // Damage from weapon
            'Damage': this.formatDamageFromAPI(itemData),
            
            // Sprite URL
            'Sprite-Link': itemData.sfn ? `https://art.fantasyonline2.com/textures/icons/items/${itemData.sfn}-icon.png` : null,
            
            // Set information (if available)
            'setName': itemData.t?.en?.sn || null,
            'setData': itemData.s || null,
            'setId': itemData.s?.sid || null
        };
        
        items.push(convertedItem);
    }
    
    return items;
},


/**
 * Helper to extract stat values from API stat objects
 * @param {Object} statObj - API stat object
 * @param {string} statName - Name of the stat
 * @returns {number} Stat value
 */
getStatValue(statObj, statName) {
    if (!statObj || typeof statObj !== 'object') return 0;
    return parseInt(statObj[statName]) || 0;  // Ensure integer conversion
},

/**
 * Helper to get Attack Speed more carefully
 * @param {Object} itemData - API item data  
 * @param {Object} typeInfo - Type information
 * @returns {number} Attack Speed value
 */
getAttackSpeed(itemData, typeInfo) {
    // Attack speed should only be on weapons
    if (typeInfo.Type !== 'weapon') {
        return 0;
    }
    
    return itemData.sta?.atks || 0;
},

/**
 * Format damage information from API
 * @param {Object} itemData - API item data  
 * @returns {string} Formatted damage string
 */
formatDamageFromAPI(itemData) {
    // From weapon example: mnd = min damage, mxd = max damage
    const minDmg = itemData.sta?.mnd || 0;
    const maxDmg = itemData.sta?.mxd || 0;
    
    if (minDmg > 0 && maxDmg > 0) {
        if (minDmg === maxDmg) {
            return minDmg.toString();
        }
        return `${minDmg}-${maxDmg}`;
    }
    return '';
},

    /**
     * Process API item data (similar to existing processItemData but for API format)
     * @param {Array} itemArray - Converted items array
     * @returns {Object} Processed items data
     */
    processAPIItemData(itemArray) {
        try {
            if (!itemArray || !Array.isArray(itemArray) || itemArray.length === 0) {
                DOMUtils.showNotification("No item data loaded from API.", "error");
                return {
                    items: {
                        weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
                        equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
                    },
                    itemsById: new Map(),
                    sets: [],
                    setsByName: new Map()
                };
            }
            
            const categorizedItems = {
                weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
                equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
            };
            
            const itemsById = new Map();
            const setsByName = new Map();
            
            itemArray.forEach(item => {
                // Process numeric fields (same as existing logic)
                if (item.Level !== undefined) item.Level = parseInt(item.Level) || 0;
                if (item.Armor !== undefined && item.Armor !== "") item.Armor = parseInt(item.Armor) || 0; else item.Armor = 0;
                if (item["Atk Spd"] !== undefined && item["Atk Spd"] !== "") item["Atk Spd"] = parseInt(item["Atk Spd"]) || 0; else item["Atk Spd"] = 0;
                
                // Process new fields
                if (item["Direct Crit"] !== undefined && item["Direct Crit"] !== "") {
                    item["Direct Crit"] = parseFloat(item["Direct Crit"]) || 0;
                } else {
                    item["Direct Crit"] = 0;
                }
                
                if (item["Direct ATK Power"] !== undefined && item["Direct ATK Power"] !== "") {
                    item["Direct ATK Power"] = parseInt(item["Direct ATK Power"]) || 0;
                } else {
                    item["Direct ATK Power"] = 0;
                }
                
                ["STA", "STR", "INT", "AGI", "Req STA", "Req STR", "Req INT", "Req AGI"].forEach(stat => {
                    item[stat] = parseInt(item[stat]) || 0;
                });
                
                // Process damage string
                const damageValues = FO2Utils.parseDamageString(item.Damage);
                item.minDamage = damageValues.minDamage;
                item.maxDamage = damageValues.maxDamage;
                
                // Categorize items
                if (item.Type && item.Subtype) {
                    const type = item.Type.toLowerCase();
                    const subtype = item.Subtype.toLowerCase();
                    
                    if (categorizedItems[type] && categorizedItems[type].hasOwnProperty(subtype)) {
                        categorizedItems[type][subtype].push(item);
                    } else {
                        console.warn(`Unknown item type/subtype combination: ${type}/${subtype} for item ${item.Name}`);
                    }
                }
                
                // Populate ID map
                if (item.hasOwnProperty('Item ID') && item['Item ID'] !== undefined) {
                    itemsById.set(item['Item ID'], item);
                }
                
                // Process set information from API
                if (item.setName && item.setData) {
                    if (!setsByName.has(item.setName)) {
                        // Convert API set format to our internal format
                        const setData = {
                            setName: item.setName,
                            description: item.setData.d || '', // Set description if available
                            bonuses: this.convertAPISetBonuses(item.setData),
                            itemIds: [],
                            items: [] // Store actual item references for easy access
                        };
                        setsByName.set(item.setName, setData);
                    }
                    
                    // Add this item to the set's item list
                    const setData = setsByName.get(item.setName);
                    setData.itemIds.push(item['Item ID']);
                    setData.items.push(item); // Add item reference
                }
            });
            
            // Sort items within each subtype by level
            for (const type in categorizedItems) {
                for (const subtype in categorizedItems[type]) {
                    categorizedItems[type][subtype].sort((a, b) => (a.Level || 0) - (b.Level || 0));
                }
            }
            
            console.log(`API item data processed. ${itemsById.size} items mapped by ID.`);
            DOMUtils.showNotification(`Successfully processed ${itemArray.length} items from API.`, 'success');
            
            return { 
                items: categorizedItems, 
                itemsById,
                sets: Array.from(setsByName.values()),
                setsByName
            };
        } catch (error) {
            console.error("Error processing API item data:", error);
            DOMUtils.showNotification("Error processing API item data. Check console.", "error");
            
            return {
                items: {
                    weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
                    equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
                },
                itemsById: new Map(),
                sets: [],
                setsByName: new Map()
            };
        }
    },

    /**
     * Convert API set bonus format to our internal format
     * @param {Object} apiSetData - API set data
     * @returns {Object} Converted set bonuses
     */
    convertAPISetBonuses(apiSetData) {
        console.log('Converting API set bonuses:', apiSetData);
        
        const bonuses = {};
        
        // Set bonuses are under sb object, with piece counts as keys
        if (apiSetData && apiSetData.sb) {
            for (const [pieceCount, bonus] of Object.entries(apiSetData.sb)) {
                bonuses[pieceCount] = {
                    CRIT: bonus.crit || 0,
                    AGI: bonus.agi || 0,
                    STR: bonus.str || 0,
                    INT: bonus.int || 0,
                    STA: bonus.sta || 0,
                    ATKP: bonus.atkp || 0,
                    ARMOR: bonus.arm || 0
                };
            }
        }
        
        console.log('Converted bonuses:', bonuses);
        return bonuses;
    },
    /**
     * Process and normalize mobs data
     * @param {Object} mobsJsonData - Raw mobs data
     * @param {Map} itemsById - Map of items by ID for drop calculations
     * @returns {Object} Processed mobs data
     */
    processMobsData(mobsJsonData, itemsById) {
        try {
            if (!mobsJsonData || !mobsJsonData.mobs || !Array.isArray(mobsJsonData.mobs)) {
                console.error("Invalid mobs data structure:", mobsJsonData);
                DOMUtils.showNotification("Error: Invalid mob data format.", "error");
                return { mobs: [], mobsMaxLevel: 1 };
            }
            
            const mobs = mobsJsonData.mobs.map(mob => {
                const avgGold = ((mob.goldMin || 0) + (mob.goldMax || 0)) / 2;
                let avgItemGold = 0;
                
                // Calculate average gold from item drops
                if (mob.drops && itemsById && itemsById.size > 0) {
                    mob.drops.forEach(drop => {
                        const itemDetails = itemsById.get(drop.itemId);
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
                    avgGoldPerKill: totalAvgGoldPerKill,
                    isBoss: FO2Config.BOSS_NAMES.has(mob.name)
                };
            });
            
            // Calculate max mob level
            const mobsMaxLevel = mobs.length > 0
                ? Math.max(...mobs.map(m => m.level || 0), 1)
                : 1;
                
            console.log(`Processed ${mobs.length} mobs. Max level: ${mobsMaxLevel}.`);
            
            return { mobs, mobsMaxLevel };
        } catch (error) {
            console.error("Error processing mobs data:", error);
            DOMUtils.showNotification("Error processing mob data. Check console.", "error");
            return { mobs: [], mobsMaxLevel: 1 };
        }
    },
    
    /**
     * Process and normalize buffs data
     * @param {Array} buffsArray - Raw buffs data
     * @returns {Object} Processed buffs data
     */
    processBuffsData(buffsArray) {
        try {
            if (!buffsArray || !Array.isArray(buffsArray)) {
                console.error("Invalid buffs data provided.");
                return { "Buff": [], "Morph": [] };
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
            const categorizedBuffs = {
                "Buff": buffsArray.filter(buff => buff.Category === "Buff"),
                "Morph": buffsArray.filter(buff => buff.Category === "Morph")
            };
            
            console.log("Buffs data processed and categorized.");
            return categorizedBuffs;
        } catch (error) {
            console.error("Error processing buffs data:", error);
            DOMUtils.showNotification("Error processing buffs data. Check console.", "error");
            return { "Buff": [], "Morph": [] };
        }
    },

    /**
     * Process and normalize spells data
     * @param {Array} spellsArray - Raw spells data
     * @returns {Array} Processed spells data
     */
    processSpellsData(spellsArray) {
        try {
            if (!spellsArray || !Array.isArray(spellsArray)) {
                console.error("Invalid spells data provided.");
                return [];
            }
            
            const processedSpells = spellsArray.map(spell => {
                // Parse numeric fields with proper error handling
                const energyCost = parseInt(spell["Energy Cost"]) || 0;
                const castTime = parseFloat(spell["Cast Time"]) || 0;
                const levelRequired = parseInt(spell["Level Required"]) || 1;
                const tier = parseInt(spell.Tier) || 1;
                const cooldown = parseFloat(spell.Cooldown) || 0;
                
                // Parse damage range
                const damageValues = FO2Utils.parseDamageString(spell.Damage);
               
                // Calculate base DPS and energy per second (without crit)
                const avgDamage = (damageValues.minDamage + damageValues.maxDamage) / 2;
                
                // Use the maximum of cast time and cooldown for effective casting rate
                // If both are 0, assume 1 second for calculation purposes
                const effectiveCastTime = Math.max(castTime, cooldown) || 1;
                
                const baseDps = avgDamage / effectiveCastTime;
                const energyPerSecond = energyCost / effectiveCastTime;
                
                return {
                    ...spell, // Preserve all original spell properties
                    energyCost,
                    castTime,
                    levelRequired,
                    tier,
                    cooldown,
                    minDamage: damageValues.minDamage,
                    maxDamage: damageValues.maxDamage,
                    avgDamage,
                    baseDps: Math.round(baseDps * 100) / 100,
                    energyPerSecond: Math.round(energyPerSecond * 100) / 100
                };
            });
            
            // Sort by level required, then by tier
            processedSpells.sort((a, b) => {
                if (a.levelRequired !== b.levelRequired) {
                    return a.levelRequired - b.levelRequired;
                }
                return a.tier - b.tier;
            });
            
            console.log(`Processed ${processedSpells.length} spells.`);
            return processedSpells;
        } catch (error) {
            console.error("Error processing spells data:", error);
            return [];
        }
    },
    
    /**
     * Load data from server API endpoints
     * @returns {Promise<Object>} Loaded data
     */
    async loadAllData() {
        try {
            DOMUtils.showNotification("Loading game data from API...", "info");
            
            // Fetch items from API
            const itemsData = await this.fetchItemsFromAPI();
            
            // Still fetch other data from local files (mobs, buffs, spells for now)
            const [mobsResponse, buffsResponse, spellsResponse] = await Promise.all([
                fetch('assets/build-sandbox/data/mobs.json').catch(e => {
                    console.error("Fetch mobs failed:", e);
                    return { ok: false, json: () => null };
                }),
                fetch('assets/build-sandbox/data/buffs.json').catch(e => {
                    console.error("Fetch buffs failed:", e);
                    return { ok: false, json: () => null };
                }),
                fetch('assets/build-sandbox/data/spells.json').catch(e => {
                    console.error("Fetch spells failed:", e);
                    return { ok: false, json: () => null };
                })
            ]);
            
            if (!mobsResponse.ok || !buffsResponse.ok || !spellsResponse.ok) {
                throw new Error("One or more data files failed to load. Check network or file paths.");
            }
            
            const rawMobsData = await mobsResponse.json();
            const rawBuffsArray = await buffsResponse.json();
            const rawSpellsArray = await spellsResponse.json();
            
            // Process data
            const buffsData = this.processBuffsData(rawBuffsArray);
            const spellsData = this.processSpellsData(rawSpellsArray);
            const mobsData = this.processMobsData(rawMobsData, itemsData.itemsById);
            
            DOMUtils.showNotification("Game data loaded successfully!", "success");
            
            return {
                items: itemsData.items,
                itemsById: itemsData.itemsById,
                mobs: mobsData.mobs,
                mobsMaxLevel: mobsData.mobsMaxLevel,
                buffs: buffsData,
                spells: spellsData,
                sets: itemsData.sets,
                setsByName: itemsData.setsByName
            };
        } catch (error) {
            console.error("Error loading data:", error);
            DOMUtils.showNotification(`Failed to load game data: ${error.message}`, "error");
            throw error;
        }
    }
};

// ------------------------------------------------------------------
// stats-calculator.js - Game mechanics calculations
// ------------------------------------------------------------------

const StatsCalculator = {
    /**
     * Calculate dodge chance based on agility
     * @param {number} totalAgi - Final agility value
     * @returns {number} Dodge percentage
     */
    calculateDodge(totalAgi) {
        let calculatedDodge = 0;
        const agi = Math.max(0, totalAgi);
        const dodge = FO2Config.GAME.DODGE;
        
        // Tier 1: 1-160 AGI (0.25% per point)
        let pointsInTier1 = Math.min(agi, dodge.TIER1_CAP);
        calculatedDodge += pointsInTier1 * dodge.TIER1_RATE;
        if (agi <= dodge.TIER1_CAP) return calculatedDodge;
        
        // Tier 2: 161-320 AGI (0.125% per point)
        let pointsInTier2 = Math.min(agi - dodge.TIER1_CAP, dodge.TIER2_CAP - dodge.TIER1_CAP);
        calculatedDodge += pointsInTier2 * dodge.TIER2_RATE;
        if (agi <= dodge.TIER2_CAP) return calculatedDodge;
        
        // Tier 3: 321-640 AGI (0.0625% per point)
        let pointsInTier3 = Math.min(agi - dodge.TIER2_CAP, dodge.TIER3_CAP - dodge.TIER2_CAP);
        calculatedDodge += pointsInTier3 * dodge.TIER3_RATE;
        if (agi <= dodge.TIER3_CAP) return calculatedDodge;
        
        // Tier 4: 641+ AGI (0.03125% per point)
        let pointsInTier4 = agi - dodge.TIER3_CAP;
        calculatedDodge += pointsInTier4 * dodge.TIER4_RATE;
        
        return calculatedDodge;
    },
    
    /**
     * Calculate critical hit chance based on AGI and INT
     * @param {Object} finalStats - Character stats after equipment and buffs
     * @param {number} baseCritical - Base critical chance value
     * @returns {number} Critical hit percentage
     */
    calculateCritical(finalStats, baseCritical) {
        let critical = baseCritical;
        const baseStatValue = FO2Config.GAME.LEVEL.BASE_STAT_POINTS;
        const critConfig = FO2Config.GAME.CRITICAL;
        
        let rawCritAddition = 0;
        if (finalStats.agi > baseStatValue) {
            rawCritAddition += (finalStats.agi - baseStatValue) * critConfig.BASE_GAIN_RATIO;
        }
        if (finalStats.int > baseStatValue) {
            rawCritAddition += (finalStats.int - baseStatValue) * critConfig.BASE_GAIN_RATIO;
        }
        
        // Apply diminishing returns above SOFT_CAP
        if (critical + rawCritAddition <= critConfig.SOFT_CAP) {
            critical += rawCritAddition;
        } else {
            if (critical < critConfig.SOFT_CAP) {
                const fullValueAddition = critConfig.SOFT_CAP - critical;
                critical = critConfig.SOFT_CAP;
                const reducedAddition = (rawCritAddition - fullValueAddition) * critConfig.REDUCTION_FACTOR;
                critical += reducedAddition;
            } else {
                critical += rawCritAddition * critConfig.REDUCTION_FACTOR;
            }
        }
        
        return critical;
    },
    
    /**
     * Calculates mitigation percentage from armor
     * @param {number} armor - Character's armor value
     * @param {number} level - Character's level
     * @returns {number} Damage mitigation percentage
     */
    calculateMitigation(armor, level) {
        if (armor <= 0) return 0;
        
        const kValue = FO2Config.GAME.ARMOR.MITIGATION_K_BASE + 
                       FO2Config.GAME.ARMOR.MITIGATION_K_LEVEL_FACTOR * level;
        
        return (armor / (kValue + armor)) * 100;
    },
    
    /**
     * Perform full stat calculation based on build state
     * @param {Object} buildState - Character build state
     * @param {Object} gameConfig - Game configuration
     * @returns {Object} Calculated stats
     */
    performFullStatCalculation(buildState, gameConfig) {
        const build = buildState;
        const base = gameConfig.GAME.BASE_STATS;
        const levelConfig = gameConfig.GAME.LEVEL;
        
        // 1. Initialize Final Character Stats
        const finalCharacterStats = {
            agi: levelConfig.BASE_STAT_POINTS + (build.statPoints.agi - levelConfig.BASE_STAT_POINTS),
            str: levelConfig.BASE_STAT_POINTS + (build.statPoints.str - levelConfig.BASE_STAT_POINTS),
            int: levelConfig.BASE_STAT_POINTS + (build.statPoints.int - levelConfig.BASE_STAT_POINTS),
            sta: levelConfig.BASE_STAT_POINTS + (build.statPoints.sta - levelConfig.BASE_STAT_POINTS)
        };
        
        // 2. Accumulators for direct bonuses
        let totalDirectArmorBonus = 0;
        let totalDirectAPBonus = 0;
        let totalDirectCritBonus = 0; // NEW: Direct crit bonus accumulator
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
                
                // NEW: Add direct crit and atk power from items
                totalDirectCritBonus += item["Direct Crit"] || 0;
                totalDirectAPBonus += item["Direct ATK Power"] || 0;
                
                if (slot === 'weapon' && item.minDamage !== undefined && item.maxDamage !== undefined) {
                    currentWeaponMinDamage = item.minDamage;
                    currentWeaponMaxDamage = item.maxDamage;
                    currentBaseAttackSpeed = item["Atk Spd"] || base.atkSpeed;
                }
            }
        }
        
        // 5. Process Active Buffs
        let rawBuffCritPercentContribution = 0;
        let atkSpeedBuffApplied = false; // Assuming non-stacking speed buffs
        
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
        
        // 6. Calculate Set Bonuses (ADD THIS SECTION)
        const setBonuses = this.calculateSetBonuses(build.equipment, StateManager.state.data.setsByName);

        // Apply set bonuses to stats
        finalCharacterStats.agi += setBonuses.AGI || 0;
        finalCharacterStats.str += setBonuses.STR || 0;
        finalCharacterStats.int += setBonuses.INT || 0;
        finalCharacterStats.sta += setBonuses.STA || 0;
        totalDirectArmorBonus += setBonuses.ARMOR || 0;
        totalDirectAPBonus += setBonuses.ATKP || 0;
        totalDirectCritBonus += setBonuses.CRIT || 0;

        // --- 7. Calculate Final Derived Stats ---
        
        // HP and Energy
        const resourceConfig = gameConfig.GAME.RESOURCES;
        let finalHP = Math.round(resourceConfig.BASE_HP_CONSTANT / 60 * build.level);
        let finalEnergy = Math.round(resourceConfig.BASE_ENERGY_CONSTANT / 60 * build.level);
        
        finalHP += Math.max(0, finalCharacterStats.sta - levelConfig.BASE_STAT_POINTS) * resourceConfig.HP_PER_STA_POINT;
        finalEnergy += Math.max(0, finalCharacterStats.int - levelConfig.BASE_STAT_POINTS) * resourceConfig.ENERGY_PER_INT_POINT;
        
        // Armor
        const armorConfig = gameConfig.GAME.ARMOR;
        let finalArmor = Math.max(0, finalCharacterStats.str - levelConfig.BASE_STAT_POINTS) * armorConfig.ARMOR_PER_STR;
        finalArmor += totalDirectArmorBonus;
        finalArmor = Math.max(0, finalArmor);
        
        // Mitigation
        let mitigationPercent = this.calculateMitigation(finalArmor, build.level);
        
        // Attack Speed
        let finalAttackSpeed = Math.max(gameConfig.GAME.DAMAGE.MIN_ATTACK_SPEED, currentBaseAttackSpeed);
        
        // Attack Power (AP)
        let finalAP = base.atkPower; // Start with base AP
        const apConfig = gameConfig.GAME.ATTACK_POWER;
        
        // Find highest stat
        let highestStatValue = levelConfig.BASE_STAT_POINTS;
        let isStrHighestDriver = false;
        
        if (finalCharacterStats.str >= levelConfig.BASE_STAT_POINTS) {
            highestStatValue = finalCharacterStats.str;
            isStrHighestDriver = true;
        }
        if (finalCharacterStats.agi > highestStatValue) {
            highestStatValue = finalCharacterStats.agi;
            isStrHighestDriver = false;
        }
        if (finalCharacterStats.int > highestStatValue) {
            highestStatValue = finalCharacterStats.int;
            isStrHighestDriver = false;
        }
        if (finalCharacterStats.sta > highestStatValue) {
            highestStatValue = finalCharacterStats.sta;
            isStrHighestDriver = false;
        }
        
        // STR takes precedence if equal to another highest stat
        if (!isStrHighestDriver && finalCharacterStats.str === highestStatValue && finalCharacterStats.str >= levelConfig.BASE_STAT_POINTS) {
            isStrHighestDriver = true;
        }
        
        // Calculate AP bonuses
        let apFromPrimaryStats = 0;
        let apFromSecondaryStr = 0;
        
        if (highestStatValue >= levelConfig.BASE_STAT_POINTS) {
            if (isStrHighestDriver) {
                apFromPrimaryStats = (finalCharacterStats.str - levelConfig.BASE_STAT_POINTS) * apConfig.STR_PRIMARY_BONUS;
            } else {
                apFromPrimaryStats = (highestStatValue - levelConfig.BASE_STAT_POINTS) * apConfig.OTHER_PRIMARY_BONUS;
                if (finalCharacterStats.str > levelConfig.BASE_STAT_POINTS) {
                    apFromSecondaryStr = (finalCharacterStats.str - levelConfig.BASE_STAT_POINTS) * apConfig.STR_SECONDARY_BONUS;
                }
            }
        }
        
        finalAP += Math.max(0, apFromPrimaryStats);
        finalAP += Math.max(0, apFromSecondaryStr);
        finalAP += totalDirectAPBonus; // Add direct AP bonus from items/buffs
        finalAP = Math.max(0, finalAP);
        
        // Critical Chance - Calculate all sources first, then apply diminishing returns to total
        let critFromStats = this.calculateCritical(finalCharacterStats, base.critical);

        // Sum all crit sources before applying diminishing returns
        let totalRawCrit = critFromStats + totalDirectCritBonus + rawBuffCritPercentContribution;

        // Apply diminishing returns to the total crit amount
        let finalCrit;
        const critConfig = gameConfig.GAME.CRITICAL;

        if (totalRawCrit <= critConfig.SOFT_CAP) {
            // Below soft cap - no diminishing returns
            finalCrit = totalRawCrit;
        } else {
            // Above soft cap - apply diminishing returns to the excess
            const excessCrit = totalRawCrit - critConfig.SOFT_CAP;
            const reducedExcess = excessCrit * critConfig.REDUCTION_FACTOR;
            finalCrit = critConfig.SOFT_CAP + reducedExcess;
        }

        finalCrit = Math.max(0, finalCrit);
        
        // Dodge Chance
        let finalDodge = this.calculateDodge(finalCharacterStats.agi);
        finalDodge = Math.max(0, finalDodge);
        
        // Final Min/Max Damage
        const attackSpeedInSeconds = finalAttackSpeed / 1000.0;
        const damageBonusFromAP = Math.floor((finalAP * attackSpeedInSeconds) / gameConfig.GAME.DAMAGE.AP_SCALE_DIVISOR);
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
            finalStats: finalCharacterStats,
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
    
    /**
 * Calculate performance against mobs using current build's DPS
 * @param {number} currentDPS - Current build's DPS
 * @param {Array} mobList - List of mobs to calculate against
 * @param {Object} filters - Performance filters (min/max levels, hide bosses)
 * @returns {Array} Performance data array
 */
calculatePerformance(currentDPS, mobList, filters) {
    const performanceData = [];
    
    if (!mobList || mobList.length === 0) {
        console.warn("Performance calculation: No mob data available");
        return performanceData;
    }
    
    if (currentDPS <= 0) {
        return performanceData;
    }
    
    const filteredMobs = mobList.filter(mob => {
        if (!mob || mob.level === undefined || mob.level === null) return false;
        const levelMatch = mob.level >= filters.minLevel && mob.level <= filters.maxLevel;
        const bossMatch = !filters.hideBosses || !mob.isBoss;
        return levelMatch && bossMatch;
    });
    
    filteredMobs.forEach(mob => {
        if (!mob.health || mob.health <= 0) {
            return; // Skip mob with invalid health
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
    
   // Sort the data based on the provided filters, not using this.state
    const sortColumn = filters.sortColumn || 'name';
    const sortAsc = filters.sortAscending !== undefined ? filters.sortAscending : true;
    
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

    return performanceData;
},
    
    /**
     * Calculate stats for a saved build object
     * @param {Object} buildObject - Saved build data
     * @param {Object} data - Data needed for calculation (itemsById, buffs)
     * @param {Object} gameConfig - Game configuration
     * @returns {Object|null} Calculated stats or null if invalid
     */
    calculateStatsForSavedBuildObject(buildObject, data, gameConfig) {
        if (!buildObject || !data.itemsById || !data.buffs) {
            console.error("calculateStatsForSavedBuildObject: Missing build data, item map, or buff data.");
            return null;
        }
        
        // Create a temporary build state with the saved data
        const tempState = {
            level: buildObject.level || 1,
            rebirth: buildObject.rebirth || false,
            statPoints: buildObject.stats || {
                agi: gameConfig.GAME.LEVEL.BASE_STAT_POINTS,
                str: gameConfig.GAME.LEVEL.BASE_STAT_POINTS,
                int: gameConfig.GAME.LEVEL.BASE_STAT_POINTS,
                sta: gameConfig.GAME.LEVEL.BASE_STAT_POINTS
            },
            equipment: {},
            activeBuffs: []
        };
        
        // Resolve item IDs to full item objects
        if (buildObject.equipment) {
            for (const slot in buildObject.equipment) {
                const itemId = buildObject.equipment[slot];
                if (itemId !== undefined && itemId !== null) {
                    const item = data.itemsById.get(itemId);
                    if (item) {
                        tempState.equipment[slot] = item;
                    } else {
                        console.warn(`calculateStatsForSavedBuildObject: Item ID ${itemId} for slot ${slot} not found.`);
                    }
                }
            }
        }
        
        // Resolve buff names to full buff objects
        if (buildObject.activeBuffNames) {
            buildObject.activeBuffNames.forEach(buffName => {
                let foundBuff = null;
                for (const category in data.buffs) {
                    if (data.buffs[category]) {
                        foundBuff = data.buffs[category].find(b => b.Name === buffName);
                        if (foundBuff) break;
                    }
                }
                
                if (foundBuff) {
                    tempState.activeBuffs.push(foundBuff);
                } else {
                    console.warn(`calculateStatsForSavedBuildObject: Buff named "${buffName}" not found.`);
                }
            });
        }
        
        // Calculate stats using the temp state
        return this.performFullStatCalculation(tempState, gameConfig);
    },

    calculateSpellDpsWithCrit: function(spell, critPercent) {
        if (!spell || !spell.baseDps) return 0;
        
        // Apply crit multiplier: (1 + crit% / 100)
        const critMultiplier = 1.0 + (critPercent / 100.0);
        return Math.round(spell.baseDps * critMultiplier);
    },

    /**
     * Calculate active set bonuses from equipped items
     * @param {Object} equipment - Equipped items
     * @param {Map} setsByName - Map of sets by name
     * @returns {Object} Active set bonuses
     */
    calculateSetBonuses(equipment, setsByName) {
        const setBonuses = {
            CRIT: 0,
            AGI: 0,
            STR: 0,
            INT: 0,
            STA: 0,
            ATKP: 0,
            ARMOR: 0
        };
        
        if (!equipment || !setsByName) return setBonuses;
        
        // Count equipped items by set
        const setCounts = new Map();
        
        Object.values(equipment).forEach(item => {
            if (item && item.setName) {
                const currentCount = setCounts.get(item.setName) || 0;
                setCounts.set(item.setName, currentCount + 1);
            }
        });
        
        // Apply set bonuses
        setCounts.forEach((count, setName) => {
            const setData = setsByName.get(setName);
            if (!setData || !setData.bonuses) return;
            
            // Find the highest applicable bonus tier
            const availableTiers = Object.keys(setData.bonuses)
                .map(tier => parseInt(tier))
                .filter(tier => tier <= count)
                .sort((a, b) => b - a); // Sort descending
            
            if (availableTiers.length > 0) {
                const applicableTier = availableTiers[0];
                const bonus = setData.bonuses[applicableTier.toString()];
                
                // Add bonuses
                Object.keys(setBonuses).forEach(stat => {
                    if (bonus[stat] !== undefined) {
                        setBonuses[stat] += bonus[stat];
                    }
                });
            }
        });
        
        return setBonuses;
    },
};

// ------------------------------------------------------------------
// state-manager.js - Application state management
// ------------------------------------------------------------------

const StateManager = {
    /**
     * State data - initialized with default values
     */
    state: {
        // Game Data
        data: {
        items: {
            weapon: { sword: [], bow: [], wand: [], staff: [], hammer: [], axe: [], pickaxe: [], lockpick: [], "2h sword": [] },
            equipment: { head: [], face: [], shoulder: [], chest: [], legs: [], back: [], ring: [], trinket: [], offhand: [], guild: [], faction: [] }
        },
        itemsById: new Map(),
        mobs: [],
        mobsMaxLevel: 1,
        buffs: { "Buff": [], "Morph": [] },
        spells: [],
        sets: [], 
        setsByName: new Map()
    },
        
        // Current Build
        currentBuild: {
            level: 1,
            rebirth: false,
            statPoints: {
                agi: FO2Config.GAME.LEVEL.BASE_STAT_POINTS,
                str: FO2Config.GAME.LEVEL.BASE_STAT_POINTS,
                int: FO2Config.GAME.LEVEL.BASE_STAT_POINTS,
                sta: FO2Config.GAME.LEVEL.BASE_STAT_POINTS
            },
            pointsRemaining: FO2Config.GAME.LEVEL.INITIAL_POINTS,
            equipment: {},
            activeBuffs: [],
            calculatedStats: {},
            selectedSpell: null

        },
        
        // UI State
        ui: {
            currentPage: 'build-editor',
            performance: {
                sortColumn: 'name',
                sortAscending: true,
                minLevel: 1,
                maxLevel: 91,
                hideBosses: false
            },
            itemDictionary: {
                search: '',
                category: 'all',
                sortCriteria: 'level',
                sortAscending: true,
                activeSorts: []
            },
            currentItemSearchSlot: null,

            mode: FO2Config.UI.MODE.SANDBOX,
        },
        
        // Saved Builds
        savedBuilds: []
    },
    
    /**
     * Initialize state manager
     * @returns {Promise} Promise that resolves when state is initialized
     */
    async initialize() {
        try {
            // Load data from API
            this.state.data = await DataService.loadAllData();
            
            // Load saved builds
            this.loadSavedBuildsList();
            
            // Load current state
            const stateLoaded = this.loadCurrentStateFromLocalStorage();
            
            // Calculate initial stats
            this.recalculatePoints();
            
            // If state wasn't loaded, trigger initial calculation
            if (!stateLoaded) {
                this.triggerRecalculationAndUpdateUI();
            }
            
            // Publish that data is loaded - ADD THIS
            EventSystem.publish('data-loaded');
            
            console.log('State manager initialized successfully.');
            return true;
        } catch (error) {
            console.error('Failed to initialize state manager:', error);
            throw error;
        }
    },
    
    /**
     * Get current state (for read-only purposes)
     * @returns {Object} Current state
     */
    getState() {
        return FO2Utils.deepClone(this.state);
    },
    
    /**
     * Update level and recalculate stats
     * @param {number} newLevel - New level value
     * @returns {number} Clamped level value
     */
    updateLevel(newLevel) {
        newLevel = parseInt(newLevel);
        if (isNaN(newLevel)) newLevel = 1;
        
        const maxLevel = this.state.currentBuild.rebirth ?
            FO2Config.GAME.LEVEL.REBIRTH_CAP :
            FO2Config.GAME.LEVEL.NORMAL_CAP;
        
        newLevel = FO2Utils.clamp(newLevel, 1, maxLevel);
        
        this.state.currentBuild.level = newLevel;
        this.recalculatePoints();
        this.triggerRecalculationAndUpdateUI();
        
        return newLevel;
    },

    setCurrentPage(pageName) {
        console.log('setCurrentPage called:', pageName);
        this.state.ui.currentPage = pageName;
        this.saveCurrentStateToLocalStorage();
        console.log('Page saved to state:', this.state.ui.currentPage);
        EventSystem.publish('page-changed', { page: pageName });
    },
    
    /**
     * Toggle rebirth status and recalculate
     * @returns {boolean} New rebirth state
     */
    toggleRebirth() {
        this.state.currentBuild.rebirth = !this.state.currentBuild.rebirth;
        
        // Adjust level if it exceeds the new max level
        const maxLevel = this.state.currentBuild.rebirth ?
            FO2Config.GAME.LEVEL.REBIRTH_CAP :
            FO2Config.GAME.LEVEL.NORMAL_CAP;
            
        if (this.state.currentBuild.level > maxLevel) {
            this.state.currentBuild.level = maxLevel;
        }
        
        this.recalculatePoints();
        this.triggerRecalculationAndUpdateUI();
        
        return this.state.currentBuild.rebirth;
    },
    
    /**
     * Update a stat value
     * @param {string} stat - Stat name (agi, str, int, sta)
     * @param {number} value - New value
     * @returns {number} Clamped stat value
     */
    updateStat(stat, value) {
        value = parseInt(value);
        const base = FO2Config.GAME.LEVEL.BASE_STAT_POINTS;
        
        if (isNaN(value) || value < base) {
            value = base;
        }
        
        const currentValue = this.state.currentBuild.statPoints[stat];
        const pointDifference = value - currentValue;
        
        // Check if adding points exceeds remaining points
        if (pointDifference > 0 && pointDifference > this.state.currentBuild.pointsRemaining) {
            value = currentValue + this.state.currentBuild.pointsRemaining;
        }
        
        this.state.currentBuild.statPoints[stat] = value;
        this.recalculatePoints();
        this.triggerRecalculationAndUpdateUI();
        
        return value;
    },
    
    /**
     * Reset all stats to base values
     */
    resetStats() {
        const base = FO2Config.GAME.LEVEL.BASE_STAT_POINTS;
        
        this.state.currentBuild.statPoints = {
            agi: base,
            str: base,
            int: base,
            sta: base
        };
        
        this.recalculatePoints();
        this.triggerRecalculationAndUpdateUI();
    },
    
    /**
     * Calculate total available stat points
     * @returns {number} Available points
     */
    calculateAvailablePoints() {
        let points = FO2Config.GAME.LEVEL.INITIAL_POINTS;
        points += (this.state.currentBuild.level - 1) * FO2Config.GAME.LEVEL.POINTS_PER_LEVEL;
        
        // Rebirth bonus
        if (this.state.currentBuild.rebirth) {
            points += Math.floor(this.state.currentBuild.level / FO2Config.GAME.LEVEL.REBIRTH_BONUS_INTERVAL);
        }
        
        return points;
    },
    
    /**
     * Calculate points spent on stats
     * @returns {number} Used points
     */
    calculateUsedPoints() {
        const base = FO2Config.GAME.LEVEL.BASE_STAT_POINTS;
        const stats = this.state.currentBuild.statPoints;
        
        return (
            (stats.agi - base) +
            (stats.str - base) +
            (stats.int - base) +
            (stats.sta - base)
        );
    },
    
    /**
     * Recalculate remaining points
     */
    recalculatePoints() {
        const available = this.calculateAvailablePoints();
        const used = this.calculateUsedPoints();
        
        this.state.currentBuild.pointsRemaining = available - used;
    },
    
    /**
     * Equip an item in a slot
     * @param {string} slot - Equipment slot name
     * @param {Object|null} itemObject - Item to equip or null to unequip
     * @returns {boolean} Whether item was equipped successfully
     */
    equipItem(slot, itemObject) {
    // Always allow unequipping
    if (!itemObject) {
        this.state.currentBuild.equipment[slot] = null;
        this.triggerRecalculationAndUpdateUI();
        return true;
    }
    
    // In restricted mode, check if requirements are met AT THE TIME OF EQUIPPING
        if (this.state.ui.mode === FO2Config.UI.MODE.RESTRICTED) {
            // Create a temporary state to see what the stats would be if the item was already equipped
            // This allows item swapping as long as the combined effect would meet requirements
            const tempState = FO2Utils.deepClone(this.state.currentBuild);
            
            // If replacing an item in the same slot, remove its stats first
            if (tempState.equipment[slot]) {
                // Remove the old item's contribution to stats
                tempState.equipment[slot] = null;
            }
            
            // Temporarily equip the new item
            tempState.equipment[slot] = itemObject;
            
            // Calculate stats with the new item in place
            const tempStats = StatsCalculator.performFullStatCalculation(tempState, FO2Config);
            
            // Check if requirements would be met AFTER equipping
            const finalStats = tempStats.finalStats;
            
            if (
                (itemObject['Req STR'] && finalStats.str < itemObject['Req STR']) ||
                (itemObject['Req INT'] && finalStats.int < itemObject['Req INT']) ||
                (itemObject['Req AGI'] && finalStats.agi < itemObject['Req AGI']) ||
                (itemObject['Req STA'] && finalStats.sta < itemObject['Req STA'])
            ) {
                // Requirements not met even after equipping
                return false;
            }
        }
        
        // Requirements met or sandbox mode, equip the item
        this.state.currentBuild.equipment[slot] = itemObject;
        this.triggerRecalculationAndUpdateUI();
        return true;
    },
    
    /**
     * Reset all equipment
     */
    resetEquipment() {
        this.state.currentBuild.equipment = {};
        this.triggerRecalculationAndUpdateUI();
    },
    
    /**
     * Add a buff to active buffs
     * @param {Object} buffObject - Buff to add
     * @returns {boolean} Whether buff was added
     */
    addBuff(buffObject) {
        const maxBuffs = FO2Config.UI.MAX_ACTIVE_BUFFS;
        const buffs = this.state.currentBuild.activeBuffs;
        
        if (buffs.length < maxBuffs && !buffs.some(b => b.Name === buffObject.Name)) {
            buffs.push(buffObject);
            this.triggerRecalculationAndUpdateUI();
            return true;
        }
        
        return false;
    },

    /**
     * Remove a buff by name
     * @param {string} buffName - Name of buff to remove
     * @returns {boolean} Whether buff was removed
     */
    removeBuff(buffName) {
        const initialLength = this.state.currentBuild.activeBuffs.length;
        this.state.currentBuild.activeBuffs = this.state.currentBuild.activeBuffs.filter(b => b.Name !== buffName);
        
        if (this.state.currentBuild.activeBuffs.length < initialLength) {
            this.triggerRecalculationAndUpdateUI();
            return true;
        }
        
        return false;
    },
    
    /**
     * Reset all active buffs
     */
    resetBuffs() {
        this.state.currentBuild.activeBuffs = [];
        this.triggerRecalculationAndUpdateUI();
    },

    /**
     * Set selected spell
     */
    setSelectedSpell(spellObject) {
        this.state.currentBuild.selectedSpell = spellObject;
        this.saveCurrentStateToLocalStorage();
        EventSystem.publish('spell-updated', spellObject);
    },
    
    /**
     * Reset spell
     */
    resetSpell() {
        this.setSelectedSpell(null);
    },
    
    /**
     * Update performance filters
     * @param {Object} filters - New filter values
     */
    updatePerformanceFilters(filters) {
    // Merge the new filters with the existing performance state
    Object.assign(this.state.ui.performance, filters);
    
    // Ensure min <= max for level filters
    if (this.state.ui.performance.minLevel > this.state.ui.performance.maxLevel) {
        this.state.ui.performance.minLevel = this.state.ui.performance.maxLevel;
    }
    
    // Clamp to valid range
    this.state.ui.performance.minLevel = Math.max(1, Math.min(
        this.state.ui.performance.minLevel, 
        this.state.data.mobsMaxLevel
    ));
    
    this.state.ui.performance.maxLevel = Math.max(
        this.state.ui.performance.minLevel, 
        Math.min(
            this.state.ui.performance.maxLevel, 
            this.state.data.mobsMaxLevel
        )
    );
    
    // Force recalculation to update the performance table
    this.triggerRecalculationAndUpdateUI();
    
    // Notify subscribers that performance filters have changed
    EventSystem.publish('performance-filters-updated', this.state.ui.performance);
},
    
    /**
     * Update item dictionary filters
     * @param {Object} filters - New filter values
     */
    updateItemDictionaryFilters(filters) {
        Object.assign(this.state.ui.itemDictionary, filters);
        EventSystem.publish('item-dictionary-updated', this.state.ui.itemDictionary);
    },
    
    /**
     * Set current item search slot
     * @param {string|null} slotName - Slot name or null to clear
     */
    setCurrentItemSearchSlot(slotName) {
        this.state.ui.currentItemSearchSlot = slotName;
    },
    
    /**
     * Trigger recalculation and UI update
     */
    triggerRecalculationAndUpdateUI() {
        // 1. Recalculate core build stats
        this.state.currentBuild.calculatedStats = StatsCalculator.performFullStatCalculation(
        this.state.currentBuild,
        FO2Config
    );
    
    // 2. Calculate performance against mobs
    const perfData = StatsCalculator.calculatePerformance(
        this.state.currentBuild.calculatedStats?.finalDPS || 0,
        this.state.data.mobs,
        this.state.ui.performance
    );
    
    // 3. Publish events for UI updates
    EventSystem.publish('stats-updated', this.state.currentBuild.calculatedStats);
    EventSystem.publish('performance-updated', {
        data: perfData,
        sortColumn: this.state.ui.performance.sortColumn,
        sortAscending: this.state.ui.performance.sortAscending
    });
    
    // 4. Update spell display with new crit values
    if (this.state.currentBuild.selectedSpell) {
        EventSystem.publish('spell-updated', this.state.currentBuild.selectedSpell);
    }

    EventSystem.publish('sets-updated');
    
    // 5. Save the current state
    this.saveCurrentStateToLocalStorage();
    },
    
    /**
     * Save current state to localStorage
     */
    saveCurrentStateToLocalStorage() {
        const saveData = {
            level: this.state.currentBuild.level,
            rebirth: this.state.currentBuild.rebirth,
            stats: this.state.currentBuild.statPoints,
            equipment: {},
            activeBuffNames: this.state.currentBuild.activeBuffs.map(buff => buff.Name),
            selectedSpellName: this.state.currentBuild.selectedSpell ? this.state.currentBuild.selectedSpell.Name : null,
            uiPerformance: this.state.ui.performance,
            uiMode: this.state.ui.mode,
            currentPage: this.state.ui.currentPage
        };
        
        // Store item IDs for equipment
        for (const slot in this.state.currentBuild.equipment) {
            if (this.state.currentBuild.equipment[slot]) {
                const itemId = this.state.currentBuild.equipment[slot]['Item ID'];
                if (itemId !== undefined) {
                    saveData.equipment[slot] = itemId;
                }
            }
        }
        
        try {
            localStorage.setItem(FO2Config.STORAGE.CURRENT_STATE_KEY, JSON.stringify(saveData));
        } catch (e) {
            console.error("Failed to save state:", e);
            DOMUtils.showNotification("Could not save current build state.", "error");
        }
    },
    
    /**
     * Load current state from localStorage
     * @returns {boolean} Whether state was loaded successfully
     */
    loadCurrentStateFromLocalStorage() {
    const savedDataString = localStorage.getItem(FO2Config.STORAGE.CURRENT_STATE_KEY);
    if (!savedDataString) {
        console.log("No saved build state found in localStorage. Using defaults.");
        return false;
    }

    try {
        const savedData = FO2Utils.safeJSONParse(savedDataString);
        if (!savedData) {
            console.error("Invalid saved state data.");
            return false;
        }

        console.log("Loading build state from localStorage:", savedData);

        // Apply saved data to currentBuild
        this.state.currentBuild.level = savedData.level || 1;
        this.state.currentBuild.rebirth = savedData.rebirth || false;
        this.state.currentBuild.statPoints = savedData.stats || {
            agi: FO2Config.GAME.LEVEL.BASE_STAT_POINTS,
            str: FO2Config.GAME.LEVEL.BASE_STAT_POINTS,
            int: FO2Config.GAME.LEVEL.BASE_STAT_POINTS,
            sta: FO2Config.GAME.LEVEL.BASE_STAT_POINTS
        };

        // Load UI mode if present
        if (savedData.uiMode) {
            this.state.ui.mode = savedData.uiMode;
        }

        // Load current page
        if (savedData.currentPage) {
            this.state.ui.currentPage = savedData.currentPage;
            console.log('Loaded currentPage from localStorage:', savedData.currentPage);
        } else {
            console.log('No currentPage found in savedData');
        }

        // Reset equipment, buffs, and spell before loading
        this.state.currentBuild.equipment = {};
        this.state.currentBuild.activeBuffs = [];
        this.state.currentBuild.selectedSpell = null; // ADD: spell support

        // Load equipment
        if (savedData.equipment && this.state.data.itemsById.size > 0) {
            for (const slot in savedData.equipment) {
                const itemIdToLoad = savedData.equipment[slot];
                const itemToEquip = this.state.data.itemsById.get(itemIdToLoad);
                if (itemToEquip) {
                    this.state.currentBuild.equipment[slot] = itemToEquip;
                } else {
                    console.warn(`Could not find item ID ${itemIdToLoad} for slot ${slot} during load.`);
                }
            }
        }

        // Load active buffs
        if (savedData.activeBuffNames && 
           (this.state.data.buffs.Buff.length > 0 || this.state.data.buffs.Morph.length > 0)) {
            savedData.activeBuffNames.forEach(buffNameToLoad => {
                let buffToActivate = null;
                for (const category in this.state.data.buffs) {
                    if (Array.isArray(this.state.data.buffs[category])) {
                        buffToActivate = this.state.data.buffs[category].find(b => b.Name === buffNameToLoad);
                        if (buffToActivate) break;
                    }
                }
                
                if (buffToActivate) {
                    this.state.currentBuild.activeBuffs.push(buffToActivate);
                } else {
                    console.warn(`Buff data missing for ${buffNameToLoad} during load.`);
                }
            });
        }

        // Load selected spell
        if (savedData.selectedSpellName && this.state.data.spells && this.state.data.spells.length > 0) {
            const spellToSelect = this.state.data.spells.find(s => s.Name === savedData.selectedSpellName);
            if (spellToSelect) {
                this.state.currentBuild.selectedSpell = spellToSelect;
            } else {
                console.warn(`Spell data missing for ${savedData.selectedSpellName} during load.`);
            }
        }

        // Load UI state (performance filters)
        if (savedData.uiPerformance) {
            Object.assign(this.state.ui.performance, savedData.uiPerformance);
            
            // Clamp loaded levels
            this.state.ui.performance.minLevel = Math.max(1, Math.min(
                parseInt(this.state.ui.performance.minLevel) || 1,
                this.state.data.mobsMaxLevel
            ));
            
            this.state.ui.performance.maxLevel = Math.max(
                this.state.ui.performance.minLevel,
                Math.min(
                    parseInt(this.state.ui.performance.maxLevel) || this.state.data.mobsMaxLevel,
                    this.state.data.mobsMaxLevel
                )
            );
        }

        // ADD: Load UI item dictionary state
        if (savedData.uiItemDictionary) {
            // Migrate old single-sort format to new multi-sort format
            if (!savedData.uiItemDictionary.activeSorts && savedData.uiItemDictionary.sortCriteria) {
                savedData.uiItemDictionary.activeSorts = [{
                    criteria: savedData.uiItemDictionary.sortCriteria,
                    ascending: savedData.uiItemDictionary.sortAscending !== false
                }];
            }
            
            Object.assign(this.state.ui.itemDictionary, savedData.uiItemDictionary);
        }

        console.log("Successfully loaded state from localStorage.");
        this.recalculatePoints();
        this.triggerRecalculationAndUpdateUI();
        
        return true;
    } catch (e) {
        console.error("Failed to load or parse saved state:", e);
        localStorage.removeItem(FO2Config.STORAGE.CURRENT_STATE_KEY);
        return false;
    }
},

/**
 * Delete a saved build
 * @param {string} buildId - ID of build to delete
 * @returns {boolean} Whether deletion was successful
 */
deleteSavedBuild(buildId) {
    const index = this.state.savedBuilds.findIndex(b => b.id === buildId);
    if (index > -1) {
        this.state.savedBuilds.splice(index, 1);
        this.saveSavedBuildsList();
        EventSystem.publish('saved-builds-updated', this.state.savedBuilds);
        return true;
    }
    return false;
},

/**
 * Duplicate a saved build
 * @param {string} buildId - ID of build to duplicate
 * @returns {Object|null} The duplicated build, or null if failed
 */
duplicateSavedBuild(buildId) {
    const originalBuild = this.state.savedBuilds.find(b => b.id === buildId);
    if (originalBuild) {
        const newBuild = FO2Utils.deepClone(originalBuild);
        newBuild.id = FO2Utils.generateId();
        newBuild.name = `${originalBuild.name} (Copy)`;
        
        const originalIndex = this.state.savedBuilds.findIndex(b => b.id === buildId);
        this.state.savedBuilds.splice(originalIndex + 1, 0, newBuild);
        this.saveSavedBuildsList();
        EventSystem.publish('saved-builds-updated', this.state.savedBuilds);
        return newBuild;
    }
    return null;
},

/**
 * Find a saved build by ID
 * @param {string} buildId - ID of build to find
 * @returns {Object|undefined} The build object, or undefined if not found
 */
findSavedBuildById(buildId) {
    return this.state.savedBuilds.find(b => b.id === buildId);
},

/**
 * Load a build from the saved list into the currentBuild state
 * @param {string} buildId - ID of build to load
 * @returns {boolean} Whether loading was successful
 */
loadBuildIntoEditor(buildId) {
    const buildToLoad = this.findSavedBuildById(buildId);
    if (!buildToLoad) {
        DOMUtils.showNotification("Error: Could not find build to load.", "error");
        return false;
    }

    console.log("Loading build into editor:", buildToLoad.name);

    // Apply saved data to currentBuild
    this.state.currentBuild.level = buildToLoad.level || 1;
    this.state.currentBuild.rebirth = buildToLoad.rebirth || false;
    this.state.currentBuild.statPoints = { ...(buildToLoad.stats || {
        agi: FO2Config.GAME.LEVEL.BASE_STAT_POINTS,
        str: FO2Config.GAME.LEVEL.BASE_STAT_POINTS,
        int: FO2Config.GAME.LEVEL.BASE_STAT_POINTS,
        sta: FO2Config.GAME.LEVEL.BASE_STAT_POINTS
    })};

    // Reset equipment & buffs before loading
    this.state.currentBuild.equipment = {};
    this.state.currentBuild.activeBuffs = [];

    // Load equipment
    if (buildToLoad.equipment && this.state.data.itemsById.size > 0) {
        for (const slot in buildToLoad.equipment) {
            const itemIdToLoad = buildToLoad.equipment[slot];
            const itemToEquip = this.state.data.itemsById.get(itemIdToLoad);
            if (itemToEquip) {
                this.state.currentBuild.equipment[slot] = itemToEquip;
            }
        }
    }

    // Load active buffs
    if (buildToLoad.activeBuffNames && 
        (this.state.data.buffs.Buff.length > 0 || this.state.data.buffs.Morph.length > 0)) {
        buildToLoad.activeBuffNames.forEach(buffNameToLoad => {
            let buffToActivate = null;
            for (const category in this.state.data.buffs) {
                if (Array.isArray(this.state.data.buffs[category])) {
                    buffToActivate = this.state.data.buffs[category].find(b => b.Name === buffNameToLoad);
                    if (buffToActivate) break;
                }
            }
            
            if (buffToActivate) {
                this.state.currentBuild.activeBuffs.push(buffToActivate);
            }
        });
    }

    // Load UI state (performance filters) if saved with the build
    if (buildToLoad.uiPerformance) {
        Object.assign(this.state.ui.performance, buildToLoad.uiPerformance);
        
        // Clamp loaded levels
        this.state.ui.performance.minLevel = Math.max(1, Math.min(
            parseInt(this.state.ui.performance.minLevel) || 1,
            this.state.data.mobsMaxLevel
        ));
        
        this.state.ui.performance.maxLevel = Math.max(
            this.state.ui.performance.minLevel,
            Math.min(
                parseInt(this.state.ui.performance.maxLevel) || this.state.data.mobsMaxLevel,
                this.state.data.mobsMaxLevel
            )
        );
    }

    this.recalculatePoints();
    this.triggerRecalculationAndUpdateUI();
    EventSystem.publish('build-loaded', buildToLoad);
    
    DOMUtils.showNotification(`Loaded build: ${buildToLoad.name}`, 'success');

    setTimeout(() => {
        UIController.updateDisplayFromState();
    }, 100);

    return true;
},

/**
 * Update performance filters
 * @param {Object} filters - New filter values
 */
updatePerformanceFilters(filters) {
    Object.assign(this.state.ui.performance, filters);
    
    // Ensure min <= max for level filters
    if (this.state.ui.performance.minLevel > this.state.ui.performance.maxLevel) {
        this.state.ui.performance.minLevel = this.state.ui.performance.maxLevel;
    }
    
    // Clamp to valid range
    this.state.ui.performance.minLevel = Math.max(1, Math.min(
        this.state.ui.performance.minLevel, 
        this.state.data.mobsMaxLevel
    ));
    
    this.state.ui.performance.maxLevel = Math.max(
        this.state.ui.performance.minLevel, 
        Math.min(
            this.state.ui.performance.maxLevel, 
            this.state.data.mobsMaxLevel
        )
    );
    
    this.triggerRecalculationAndUpdateUI();
    EventSystem.publish('performance-filters-updated', this.state.ui.performance);
},

loadSavedBuildsList() {
    const buildsString = localStorage.getItem(FO2Config.STORAGE.SAVED_BUILDS_KEY);
    this.state.savedBuilds = FO2Utils.safeJSONParse(buildsString, []);
    console.log(`Loaded ${this.state.savedBuilds.length} saved builds from list.`);
},

/**
 * Save the list of builds to localStorage
 */
saveSavedBuildsList() {
    try {
        localStorage.setItem(
            FO2Config.STORAGE.SAVED_BUILDS_KEY,
            JSON.stringify(this.state.savedBuilds)
        );
    } catch (e) {
        console.error("Failed to save builds list:", e);
        DOMUtils.showNotification("Error saving builds list.", "error");
    }
},

/**
 * Add a new build to the saved list
 * @param {Object} buildData - Build data to save
 */
addSavedBuild(buildData) {
    this.state.savedBuilds.push(buildData);
    this.saveSavedBuildsList();
    EventSystem.publish('saved-builds-updated', this.state.savedBuilds);
},

/**
 * Update an existing saved build
 * @param {string} buildId - ID of build to update
 * @param {Object} updatedData - New data to apply
 * @returns {boolean} Whether update was successful
 */
updateSavedBuild(buildId, updatedData) {
    const index = this.state.savedBuilds.findIndex(b => b.id === buildId);
    
    if (index > -1) {
        // Only update specific fields provided in updatedData
        Object.assign(this.state.savedBuilds[index], updatedData);
        this.saveSavedBuildsList();
        EventSystem.publish('saved-builds-updated', this.state.savedBuilds);
        return true;
    }
    
    return false;
},

/**
 * Toggle between sandbox and restricted mode
 * @returns {string} New mode
 */
toggleMode() {
    const newMode = this.state.ui.mode === FO2Config.UI.MODE.SANDBOX
        ? FO2Config.UI.MODE.RESTRICTED
        : FO2Config.UI.MODE.SANDBOX;
    
    this.state.ui.mode = newMode;
    
    // Validate equipment when switching to restricted mode
    if (newMode === FO2Config.UI.MODE.RESTRICTED) {
        this.validateEquipmentRequirements();
    }
    
    // Save the current state and notify UI
    this.saveCurrentStateToLocalStorage();
    EventSystem.publish('mode-changed', { mode: newMode });
    
    return newMode;
},

/**
 * Fix to validateEquipmentRequirements - remove this functionality
 * Items should NOT be unequipped when switching to restricted mode
 * @returns {Array} Empty array since no items are unequipped
 */
validateEquipmentRequirements() {
    // In the actual game, equipment is not unequipped when requirements are no longer met
    // So this function now does nothing and returns an empty array
    return [];
}

};

// ------------------------------------------------------------------
// ui-controller.js - UI update and event handling
// ------------------------------------------------------------------

const UIController = {
    /**
     * Initialize the UI
     */
    initialize() {
        this.setupTabbedNavigation();
        this.populateBuffGrid();
        this.populateSetsList();
        this.updateDisplayFromState();
        this.setupEventListeners();
     //   this.addPerformanceTableSortListeners(); //
        this.registerSlotItemRemovedListener();
        this.restoreSavedPage();
    },
    
    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {

        // Mode toggle switch - sandbox/restricted
        const modeToggleSwitch = DOMUtils.getElement('mode-toggle');
        if (modeToggleSwitch) {
            modeToggleSwitch.addEventListener('change', () => {
                const newMode = StateManager.toggleMode();
                this.updateModeDisplay(newMode);
            });
        }

        // Level input/slider
        const levelInput = DOMUtils.getElement('level');
        const levelSlider = DOMUtils.getElement('level-slider');
        if (levelInput) {
            levelInput.addEventListener('change', () => {
                const newLevel = StateManager.updateLevel(levelInput.value);
                levelInput.value = newLevel;
                if (levelSlider) levelSlider.value = newLevel;
            });
        }
        if (levelSlider) {
            levelSlider.addEventListener('input', () => {
                if (levelInput) levelInput.value = levelSlider.value;
                StateManager.updateLevel(levelSlider.value);
            });
        }
        
        // Rebirth toggle
        const rebirthIcon = DOMUtils.getElement('rebirth-icon-clickable');
        if (rebirthIcon) {
            rebirthIcon.addEventListener('click', () => {
                const isRebirth = StateManager.toggleRebirth();
                const rebirthStatus = DOMUtils.getElement('rebirth-status-icon');
                if (rebirthStatus) {
                    rebirthStatus.classList.toggle('active', isRebirth);
                }
                
                // Update max levels on input/slider
                const maxLevel = isRebirth ? 
                    FO2Config.GAME.LEVEL.REBIRTH_CAP : 
                    FO2Config.GAME.LEVEL.NORMAL_CAP;
                
                if (levelInput) levelInput.max = maxLevel;
                if (levelSlider) levelSlider.max = maxLevel;
            });
        }
        
        // Stat inputs and buttons
        ['agi', 'str', 'int', 'sta'].forEach(stat => {
            const inputElement = DOMUtils.getElement(`${stat}-value`);
            if (inputElement) {
                inputElement.addEventListener('change', () => {
                    const newValue = StateManager.updateStat(stat, inputElement.value);
                    inputElement.value = newValue;
                });
            }
            
            // Decrease button
            const decreaseButton = document.querySelector(`.stat-button.decrease[data-stat="${stat}"]`);
            if (decreaseButton) {
                decreaseButton.addEventListener('click', () => {
                    if (inputElement) {
                        const currentValue = parseInt(inputElement.value);
                        const baseValue = FO2Config.GAME.LEVEL.BASE_STAT_POINTS;
                        if (currentValue > baseValue) {
                            inputElement.value = baseValue;
                            StateManager.updateStat(stat, baseValue);
                        }
                    }
                });
            }
            
            // Increase button
            const increaseButton = document.querySelector(`.stat-button.increase[data-stat="${stat}"]`);
            if (increaseButton) {
                increaseButton.addEventListener('click', () => {
                    if (inputElement) {
                        const currentValue = parseInt(inputElement.value);
                        const newValue = currentValue + StateManager.state.currentBuild.pointsRemaining;
                        inputElement.value = newValue;
                        StateManager.updateStat(stat, newValue);
                    }
                });
            }
            
            // Reset button
            const resetButton = document.querySelector(`.stat-button.reset[data-stat="${stat}"]`);
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    if (inputElement) {
                        const baseValue = FO2Config.GAME.LEVEL.BASE_STAT_POINTS;
                        inputElement.value = baseValue;
                        StateManager.updateStat(stat, baseValue);
                    }
                });
            }
        });
        
        // Reset stats button
        const resetStatsButton = DOMUtils.getElement('reset-button');
        if (resetStatsButton) {
            resetStatsButton.addEventListener('click', () => {
                StateManager.resetStats();
                this.updateStatInputs();
            });
        }
        
        // Reset buffs button
        const resetBuffsButton = DOMUtils.getElement('reset-buffs-button');
        if (resetBuffsButton) {
            resetBuffsButton.addEventListener('click', () => {
                StateManager.resetBuffs();
                this.updateBuffGrid();
            });
        }
        
        // Reset equipment button
        const resetEquipmentButton = DOMUtils.getElement('reset-equipment-button');
        if (resetEquipmentButton) {
            resetEquipmentButton.addEventListener('click', () => {
                StateManager.resetEquipment();
                this.updateEquipmentSlots();
            });
        }
        
        // Equipment slots
        document.querySelectorAll('.slot').forEach(slotElement => {
            if (slotElement.classList.contains('placeholder')) return;
            
            const slotName = slotElement.dataset.slot;
            if (!slotName) return;
            
            slotElement.addEventListener('click', (event) => {
                // Prevent search if clear button was clicked
                if (event.target.classList.contains('clear-slot')) return;
                this.openItemSearch(slotElement);
            });
            
            slotElement.addEventListener('mouseenter', () => {
                this.showItemTooltip(slotElement);
            });
            
            slotElement.addEventListener('mouseleave', () => {
                UIFactory.hideTooltip('item-tooltip');
            });
        });
        
        // Item search modal
        const itemSearchInput = DOMUtils.getElement('item-search-input');
        const cancelSearchButton = DOMUtils.getElement('cancel-search');
        
        if (itemSearchInput) {
            itemSearchInput.addEventListener('input', () => {
                this.populateSearchResults(itemSearchInput.value);
            });
        }
        
        if (cancelSearchButton) {
            cancelSearchButton.addEventListener('click', () => {
                this.closeItemSearch();
            });
        }
        
        /*
        // Performance table sorting
        document.querySelectorAll('.performance-table th[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const sortColumn = header.dataset.sort;
                const currentSort = StateManager.state.ui.performance.sortColumn;
                const currentAsc = StateManager.state.ui.performance.sortAscending;
                
                if (currentSort === sortColumn) {
                    StateManager.state.ui.performance.sortAscending = !currentAsc;
                } else {
                    StateManager.state.ui.performance.sortColumn = sortColumn;
                    StateManager.state.ui.performance.sortAscending = true;
                }
                
                const perfData = StateManager.calculatePerformance();
                this.updatePerformanceTable(perfData);
                StateManager.saveCurrentStateToLocalStorage();
            });
        });
        
        // Performance filters
        const hideBossesCheckbox = DOMUtils.getElement('hide-bosses-checkbox');
        const minLevelSlider = DOMUtils.getElement('mob-level-min-slider');
        const maxLevelSlider = DOMUtils.getElement('mob-level-max-slider');
        
        if (hideBossesCheckbox) {
            hideBossesCheckbox.addEventListener('change', () => {
                StateManager.updatePerformanceFilters({
                    hideBosses: hideBossesCheckbox.checked
                });
            });
        }
        
        if (minLevelSlider) {
            minLevelSlider.addEventListener('input', () => {
                this.handleFilterSliderChange();
            });
        }
        
        if (maxLevelSlider) {
            maxLevelSlider.addEventListener('input', () => {
                this.handleFilterSliderChange();
            });
        }

        */
        
        // Save build button
        const saveBuildButton = DOMUtils.getElement('save-build-button');
        if (saveBuildButton) {
            saveBuildButton.addEventListener('click', () => {
                this.openBuildModal();
            });
        }
        
        // Build modal
        const modalSaveButton = DOMUtils.getElement('modal-save-button');
        const modalCloseButton = document.querySelector('#build-details-modal .close-button');
        
        if (modalSaveButton) {
            modalSaveButton.addEventListener('click', () => {
                this.handleSaveBuildDetails();
            });
        }
        
        if (modalCloseButton) {
            modalCloseButton.addEventListener('click', () => {
                this.closeBuildModal();
            });
        }
        
        // Item dictionary filters
        const dictionarySearch = DOMUtils.getElement('item-dictionary-search');
        const dictionaryCategory = DOMUtils.getElement('item-dictionary-category-filter');

        const handleDictionaryFilterChange = () => {
            if (dictionarySearch && dictionaryCategory) {
                StateManager.updateItemDictionaryFilters({
                    search: dictionarySearch.value.toLowerCase(),
                    category: dictionaryCategory.value
                });
            }
        };

        // Item dictionary sort buttons
        const sortButtons = document.querySelectorAll('.sort-button[data-sort]');
        sortButtons.forEach(button => {
            button.addEventListener('click', () => {
                const sortType = button.dataset.sort;
                const activeSorts = StateManager.state.ui.itemDictionary.activeSorts;
                
                // Find if this sort is already active
                const existingIndex = activeSorts.findIndex(sort => sort.criteria === sortType);
                
                if (existingIndex !== -1) {
                    // Sort is already active
                    const currentSort = activeSorts[existingIndex];
                    
                    if (currentSort.ascending) {
                        // First click -> Second click: Change to descending
                        activeSorts[existingIndex].ascending = false;
                    } else {
                        // Second click -> Third click: Remove this sort
                        activeSorts.splice(existingIndex, 1);
                    }
                } else {
                    // Sort is not active - add it
                    activeSorts.push({ criteria: sortType, ascending: true });
                }
                
                // Update legacy properties for compatibility
                if (activeSorts.length > 0) {
                    StateManager.state.ui.itemDictionary.sortCriteria = activeSorts[0].criteria;
                    StateManager.state.ui.itemDictionary.sortAscending = activeSorts[0].ascending;
                }
                
                // Trigger update
                StateManager.updateItemDictionaryFilters({
                    activeSorts: [...activeSorts] // Create new array to trigger reactivity
                });
                
                UIController.updateSortButtonsDisplay();
            });
        });
        
        if (dictionarySearch) dictionarySearch.addEventListener('input', handleDictionaryFilterChange);
        if (dictionaryCategory) dictionaryCategory.addEventListener('change', handleDictionaryFilterChange);
        
        // Subscribe to events
        EventSystem.subscribe('stats-updated', (calculatedStats) => {
            this.updateDisplay(calculatedStats);
        });
        
        EventSystem.subscribe('data-loaded', () => {
            this.populateSetsList();
        });

        EventSystem.subscribe('performance-updated', (data) => {
            this.updatePerformanceTable(data.data);
        });
        
        EventSystem.subscribe('saved-builds-updated', () => {
            this.displaySavedBuilds();
        });
        
        EventSystem.subscribe('item-dictionary-updated', () => {
            this.populateItemDictionaryGrid();
        });
        
        EventSystem.subscribe('build-loaded', () => {
            this.updateDisplayFromState();
        });

        EventSystem.subscribe('sets-updated', () => {
            this.updateSetBonusesDisplay();
        });
        
        EventSystem.subscribe('page-changed', (data) => {
            if (data.page === 'build-management') {
                this.displaySavedBuilds();
            } else if (data.page === 'item-dictionary') {
                this.populateItemDictionaryGrid();
            }
        });

        EventSystem.subscribe('item-dictionary-updated', () => {
            this.populateItemDictionaryGrid();
            this.updateSortButtonsDisplay(); // Add this line
        });

        EventSystem.subscribe('load-build', (data) => {
            // This handles when a build is clicked to be loaded
            if (data && data.buildId) {
                // Switch to editor page first
                const editorButton = document.querySelector('.nav-button[data-page="build-editor"]');
                if (editorButton) {
                    editorButton.click();
                }
                
                // Load the build
                StateManager.loadBuildIntoEditor(data.buildId);
            }
        });
        
        EventSystem.subscribe('edit-build', (data) => {
            if (data && data.buildId) {
                this.openBuildModal(data.buildId);
            }
        });

        EventSystem.subscribe('delete-build', (data) => {
            if (data && data.buildId) {
                const build = StateManager.findSavedBuildById(data.buildId);
                if (build) {
                    if (confirm(`Delete build "${build.name}"?`)) {
                        StateManager.deleteSavedBuild(data.buildId);
                    }
                }
            }
        });
        
        EventSystem.subscribe('duplicate-build', (data) => {
            if (data && data.buildId) {
                StateManager.duplicateSavedBuild(data.buildId);
            }
        });

        EventSystem.subscribe('page-changed', (data) => {
            if (data.page === 'item-dictionary') {
                // Add export/import buttons if they don't exist
                if (!document.querySelector('.export-import-section')) {
                    ItemDictionaryEnhancements.addExportImportButtons();
                }
            }
        });

    const spellSlot = DOMUtils.getElement('spell-slot');
    if (spellSlot) {
        spellSlot.addEventListener('click', (event) => {
            if (!event.target.classList.contains('spell-clear')) {
                this.openSpellSearch();
            }
        });
        
        spellSlot.addEventListener('mouseenter', () => {
            const selectedSpell = StateManager.state.currentBuild.selectedSpell;
            if (selectedSpell) {
                const content = UIFactory.generateSpellTooltipContent(selectedSpell);
                UIFactory.createTooltip(spellSlot, content, 'spell-tooltip', 'item-tooltip');
            }
        });
        
        spellSlot.addEventListener('mouseleave', () => {
            UIFactory.hideTooltip('spell-tooltip');
        });
    }
    
    // Subscribe to spell update events
    EventSystem.subscribe('spell-updated', () => {
        this.updateSpellDisplay();
    });

    EventSystem.subscribe('stats-updated', (calculatedStats) => {
    this.updateDisplay(calculatedStats);
    // Update spell display when stats change (ADD THIS)
    this.updateSpellDisplay();
});

// 14. Subscribe to mode changes
EventSystem.subscribe('mode-changed', (data) => {
    UIController.updateModeDisplay(data.mode);
    
    if (data.mode === FO2Config.UI.MODE.RESTRICTED) {
        DOMUtils.showNotification('Switched to Restricted Mode - stat requirements enforced when equipping new items', 'info');
    } else {
        DOMUtils.showNotification('Switched to Sandbox Mode - no stat requirements', 'info');
    }
});

    },

    setupEquipmentSlotEvents() {
    // Add event delegation for clear buttons at the document level
    document.addEventListener('click', (e) => {
        const clearButton = e.target.closest('.clear-slot');
        if (clearButton) {
            e.stopPropagation(); // Stop event from bubbling up to parent slots
            
            // Find the parent slot and get its name
            const slotElement = clearButton.closest('.slot');
            if (slotElement && slotElement.dataset.slot) {
                const slotName = slotElement.dataset.slot;
                
                // Remove the item via state manager
                StateManager.equipItem(slotName, null);
                
                // Update UI
                UIController.updateEquipmentSlots();
            }
        }
    });
    
    // Set up regular slot clicks for opening item search
    document.querySelectorAll('.slot').forEach(slotElement => {
        if (slotElement.classList.contains('placeholder')) return;
        
        const slotName = slotElement.dataset.slot;
        if (!slotName) return;
        
        // Remove any existing click listeners
        const newSlot = slotElement.cloneNode(true);
        slotElement.parentNode.replaceChild(newSlot, slotElement);
        
        // Add new click listener that won't trigger if clear button is clicked
        newSlot.addEventListener('click', (event) => {
            // Prevent search if clear button was clicked
            if (event.target.closest('.clear-slot')) return;
            
            UIController.openItemSearch(newSlot);
        });
        
        // Add hover events for tooltips
        newSlot.addEventListener('mouseenter', () => {
            UIController.showItemTooltip(newSlot);
        });
        
        newSlot.addEventListener('mouseleave', () => {
            UIFactory.hideTooltip('item-tooltip');
        });
    });
},

registerSlotItemRemovedListener() {
    // Subscribe to the slot-item-removed event
    EventSystem.subscribe('slot-item-removed', (data) => {
        if (data && data.slot) {
            StateManager.equipItem(data.slot, null);
            this.updateEquipmentSlots();
            DOMUtils.showNotification(`Removed item from ${data.slot}`, 'info');
        }
    });
},

    addPerformanceTableSortListeners() {
    // First, remove any existing click event listeners to prevent duplicates
    document.querySelectorAll('.performance-table th[data-sort]').forEach(header => {
        // Clone the node to remove all event listeners
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        // Add the event listener to the new node
        newHeader.addEventListener('click', () => {
            const sortColumn = newHeader.dataset.sort;
            
            // Get current state directly from StateManager
            const currentState = StateManager.getState();
            const currentSort = currentState.ui.performance.sortColumn;
            const currentAsc = currentState.ui.performance.sortAscending;
            
            // Determine new sort direction
            let newSortAsc = true;
            if (currentSort === sortColumn) {
                // Toggle direction if already sorting by this column
                newSortAsc = !currentAsc;
            }
            
            console.log(`Sorting by ${sortColumn}, direction: ${newSortAsc ? 'asc' : 'desc'}`);
            
            // Update the UI state with new sort parameters
            StateManager.updatePerformanceFilters({
                sortColumn: sortColumn,
                sortAscending: newSortAsc
            });
        });
    });
},
    
    /**
     * Set up tabbed navigation
     */
    setupTabbedNavigation() {
        DOMUtils.setupTabbedNavigation('.nav-button', '.page');
    },
    
    /**
     * Update all UI elements from current state
     */
    updateDisplayFromState() {
        const state = StateManager.getState();
        const build = state.currentBuild;
        const uiPerf = state.ui.performance;
        
        // Level and Rebirth
        const levelInput = DOMUtils.getElement('level');
        const levelSlider = DOMUtils.getElement('level-slider');
        const rebirthStatusIcon = DOMUtils.getElement('rebirth-status-icon');
        
        if (levelInput) levelInput.value = build.level;
        if (levelSlider) levelSlider.value = build.level;
        
        const maxLevel = build.rebirth ? 
            FO2Config.GAME.LEVEL.REBIRTH_CAP : 
            FO2Config.GAME.LEVEL.NORMAL_CAP;
            
        if (levelInput) levelInput.max = maxLevel;
        if (levelSlider) levelSlider.max = maxLevel;
        
        if (rebirthStatusIcon) {
            rebirthStatusIcon.classList.toggle('active', build.rebirth);
        }
        
        // Stat Inputs
        this.updateStatInputs();
        
        // Equipment Slots
        this.updateEquipmentSlots();
        
        // Buff Grid
        this.updateBuffGrid();

        // Spell Slot
        this.updateSpellDisplay();

        // Update sort buttons display
        this.updateSortButtonsDisplay();
        
        // Performance Filters

        /*
        const hideBossesCheckbox = DOMUtils.getElement('hide-bosses-checkbox');
        const minLevelSlider = DOMUtils.getElement('mob-level-min-slider');
        const maxLevelSlider = DOMUtils.getElement('mob-level-max-slider');
        */

        const minLevelDisplay = DOMUtils.getElement('min-level-display');
        const maxLevelDisplay = DOMUtils.getElement('max-level-display');
        
        /* if (hideBossesCheckbox) hideBossesCheckbox.checked = uiPerf.hideBosses; 
        if (minLevelSlider) minLevelSlider.value = uiPerf.minLevel;
        if (maxLevelSlider) maxLevelSlider.value = uiPerf.maxLevel;
        */
        if (minLevelDisplay) minLevelDisplay.textContent = uiPerf.minLevel;
        if (maxLevelDisplay) maxLevelDisplay.textContent = uiPerf.maxLevel;
        
        // Update calculated stats display
        this.updateDisplay(build.calculatedStats);

        // Update mode display
        this.updateModeDisplay(StateManager.state.ui.mode);

        // Update set bonus display
        this.updateSetBonusesDisplay();

    },
    
    /**
     * Update the display with calculated stats
     * @param {Object} results - Calculated stats
     */
    updateDisplay(results) {
        if (!results || !results.finalStats) {
            console.warn("updateDisplay called with invalid results:", results);
            return;
        }
        
        // Base Stats
        const staDisplay = DOMUtils.getElement('sta-display');
        const strDisplay = DOMUtils.getElement('str-display');
        const agiDisplay = DOMUtils.getElement('agi-display');
        const intDisplay = DOMUtils.getElement('int-display');
        
        if (staDisplay) staDisplay.textContent = results.finalStats.sta;
        if (strDisplay) strDisplay.textContent = results.finalStats.str;
        if (agiDisplay) agiDisplay.textContent = results.finalStats.agi;
        if (intDisplay) intDisplay.textContent = results.finalStats.int;
        
        // Derived Stats
        const healthValue = DOMUtils.getElement('health-value');
        const energyValue = DOMUtils.getElement('energy-value');
        const armorDisplay = DOMUtils.getElement('armor-display');
        const atkspeedDisplay = DOMUtils.getElement('atkspeed-display');
        const atkpowerDisplay = DOMUtils.getElement('atkpower-display');
        const critDisplay = DOMUtils.getElement('crit-display');
        const dodgeDisplay = DOMUtils.getElement('dodge-display');
        const damageDisplay = DOMUtils.getElement('damage-display');
        
        if (healthValue) healthValue.textContent = `${results.finalHP}/${results.finalHP}`;
        if (energyValue) energyValue.textContent = `${results.finalEnergy}/${results.finalEnergy}`;
        if (armorDisplay) armorDisplay.textContent = results.finalArmor;
        if (atkspeedDisplay) atkspeedDisplay.textContent = (results.finalAttackSpeed / 1000.0).toFixed(1);
        if (atkpowerDisplay) atkpowerDisplay.textContent = results.finalAP;
        if (critDisplay) critDisplay.textContent = results.finalCrit.toFixed(2) + ' %';
        if (dodgeDisplay) dodgeDisplay.textContent = results.finalDodge.toFixed(2) + ' %';
        if (damageDisplay) damageDisplay.textContent = `(${results.finalMinDamage}-${results.finalMaxDamage})`;
        
        // Extra stats
        const dpsDisplay = DOMUtils.getElement('dps-display');
        const mitigationDisplay = DOMUtils.getElement('mitigation-display');
        const hpRegenDisplay = DOMUtils.getElement('hp-regen-display');
        const energyRegenDisplay = DOMUtils.getElement('energy-regen-display');
        
        if (dpsDisplay) dpsDisplay.textContent = Math.round(results.finalDPS);
        if (mitigationDisplay) mitigationDisplay.textContent = results.mitigationPercent.toFixed(2) + ' %';
        if (hpRegenDisplay) hpRegenDisplay.textContent = results.finalHPRegenPerSecond.toFixed(1);
        if (energyRegenDisplay) energyRegenDisplay.textContent = results.finalEnergyRegenPerSecond.toFixed(1);
        
        // Remaining points
        const remainingPointsDisplay = DOMUtils.getElement('remaining-points');
        if (remainingPointsDisplay) {
            remainingPointsDisplay.textContent = StateManager.state.currentBuild.pointsRemaining;
        }
    },
    
    /**
     * Update stat input elements
     */
    updateStatInputs() {
        const stats = StateManager.state.currentBuild.statPoints;
        const agiValue = DOMUtils.getElement('agi-value');
        const strValue = DOMUtils.getElement('str-value');
        const intValue = DOMUtils.getElement('int-value');
        const staValue = DOMUtils.getElement('sta-value');
        
        if (agiValue) agiValue.value = stats.agi;
        if (strValue) strValue.value = stats.str;
        if (intValue) intValue.value = stats.int;
        if (staValue) staValue.value = stats.sta;
    },
    
    /**
     * Update equipment slot elements
     */
    updateEquipmentSlots() {
        const equipment = StateManager.state.currentBuild.equipment;
        
        document.querySelectorAll('.slot').forEach(slotElement => {
            if (slotElement.classList.contains('placeholder')) return;
            
            const slotName = slotElement.dataset.slot;
            if (!slotName) return;
            
            UIFactory.updateSlotContent(slotElement, slotName, equipment[slotName]);
        });
    },
    
    /**
     * Populate the buff grid
     */
    populateBuffGrid() {
        const buffGrid = DOMUtils.getElement('buff-grid');
        if (!buffGrid) return;
        
        DOMUtils.clearElement(buffGrid);
        
        const buffsState = StateManager.state.data.buffs;
        
        Object.keys(buffsState).forEach(category => {
            buffsState[category].forEach(buff => {
                const isActive = StateManager.state.currentBuild.activeBuffs.some(b => b.Name === buff.Name);
                const buffElement = UIFactory.createBuffIcon(buff, isActive, (buff) => {
                    this.handleToggleBuffClick(buff);
                });
                
                buffGrid.appendChild(buffElement);
            });
        });
        
        this.updateBuffCount();
    },
    
        /**
         * Populate the sets list
         */
        populateSetsList() {
        const setsList = DOMUtils.getElement('sets-list');
        const setsCount = DOMUtils.getElement('available-sets-count');
        
        if (!setsList) return;
        
        DOMUtils.clearElement(setsList);
        
        const sets = StateManager.state.data.sets || [];
        
        if (setsCount) {
            setsCount.textContent = `(${sets.length})`;
        }
        
        if (sets.length === 0) {
            setsList.innerHTML = '<div class="no-sets">No sets available</div>';
            return;
        }
        
        // Categorize sets by tier
        const setCategories = {
            dragon: [],
            bastion: [],
            knight: [],
            mage: [],
            misc: []
        };
        
        sets.forEach(setData => {
            const setName = setData.setName.toLowerCase();
            
            if (setName.includes('dragon')) {
                setCategories.dragon.push(setData);
            } else if (setName.includes('bastion')) {
                setCategories.bastion.push(setData);
            } else if (setName.includes('knight')) {
                setCategories.knight.push(setData);
            } else if (setName.includes('mage')) {
                setCategories.mage.push(setData);
            } else {
                setCategories.misc.push(setData);
            }
        });
        
        // Sort each category by tier (extract numbers from set names)
        Object.keys(setCategories).forEach(category => {
            setCategories[category].sort((a, b) => {
                const getTier = (name) => {
                    const match = name.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 999; // Put non-numbered sets at end
                };
                return getTier(a.setName) - getTier(b.setName);
            });
        });
        
        // Create grid container
        const gridContainer = DOMUtils.createElement('div', {
            className: 'sets-grid-container'
        });
        
        // Create columns in order: mage, knight, bastion, dragon, misc
        const columnOrder = ['mage', 'knight', 'bastion', 'dragon', 'misc'];
        
        columnOrder.forEach(category => {
            if (setCategories[category].length > 0) {
                const column = DOMUtils.createElement('div', {
                    className: 'sets-column'
                });
                
                setCategories[category].forEach(setData => {
                    const setButton = UIFactory.createSetItem(setData, (set) => {
                        this.handleEquipSet(set);
                    });
                    column.appendChild(setButton);
                });
                
                gridContainer.appendChild(column);
            }
        });
        
        setsList.appendChild(gridContainer);
    },

/**
 * Handle equipping a complete set - duplicate ring/trinket to both slots
 * @param {Object} setData - Set data to equip
 */
handleEquipSet(setData) {
    console.log(`Equipping set: ${setData.setName}`);
    console.log('Set items:', setData.items.map(item => `${item.Subtype}: ${item.Name}`));
    
    let equippedCount = 0;
    let failedItems = [];
    
    // Direct slot assignment
    const slotAssignments = {
        'head': 'head',
        'face': 'face', 
        'shoulder': 'shoulder',
        'chest': 'chest',
        'legs': 'legs',
        'back': 'back',
        'offhand': 'offhand',
        'guild': 'guild',
        'faction': 'faction'
    };
    
    // Separate items by type
    const weapons = setData.items.filter(item => 
        ['sword', 'bow', 'wand', 'staff', 'hammer', 'axe', '2h sword'].includes(item.Subtype)
    );
    
    const rings = setData.items.filter(item => item.Subtype === 'ring');
    const trinkets = setData.items.filter(item => item.Subtype === 'trinket');
    const otherItems = setData.items.filter(item => 
        !['sword', 'bow', 'wand', 'staff', 'hammer', 'axe', '2h sword', 'ring', 'trinket'].includes(item.Subtype)
    );
    
    console.log('Weapons found:', weapons.map(w => `${w.Subtype}: ${w.Name}`));
    console.log('Rings found:', rings.map(r => r.Name));
    console.log('Trinkets found:', trinkets.map(t => t.Name));
    console.log('Other items:', otherItems.map(item => `${item.Subtype}: ${item.Name}`));
    
    // BATCH EQUIP: Temporarily disable UI updates
    const originalTriggerRecalc = StateManager.triggerRecalculationAndUpdateUI;
    StateManager.triggerRecalculationAndUpdateUI = () => {}; // Temporarily disable
    
    // Equip one weapon (prefer 1h over 2h)
    if (weapons.length > 0) {
        const sortedWeapons = weapons.sort((a, b) => {
            const aIs2h = a.Subtype.includes('2h') || a.Subtype === 'bow' || a.Subtype === 'staff';
            const bIs2h = b.Subtype.includes('2h') || b.Subtype === 'bow' || b.Subtype === 'staff';
            
            if (aIs2h && !bIs2h) return -1;
            if (!aIs2h && bIs2h) return 1;   // prefer 2h over 1h
            return 0;
        });
        
        const weaponToEquip = sortedWeapons[0];
        console.log(`Equipping weapon: ${weaponToEquip.Name} (${weaponToEquip.Subtype})`);
        StateManager.state.currentBuild.equipment.weapon = weaponToEquip;
        equippedCount++;
    }
    
    // Equip the SAME ring to BOTH ring slots
    if (rings.length > 0) {
        const ringToEquip = rings[0]; // Take the first (should be only one)
        console.log(`Equipping ring to both slots: ${ringToEquip.Name}`);
        StateManager.state.currentBuild.equipment.ring1 = ringToEquip;
        StateManager.state.currentBuild.equipment.ring2 = ringToEquip;
        equippedCount += 2; // Count as 2 since we equipped to 2 slots
    }
    
    // Equip the SAME trinket to BOTH trinket slots
    if (trinkets.length > 0) {
        const trinketToEquip = trinkets[0]; // Take the first (should be only one)
        console.log(`Equipping trinket to both slots: ${trinketToEquip.Name}`);
        StateManager.state.currentBuild.equipment.trinket1 = trinketToEquip;
        StateManager.state.currentBuild.equipment.trinket2 = trinketToEquip;
        equippedCount += 2; // Count as 2 since we equipped to 2 slots
    }
    
    // Equip other single-slot items
    otherItems.forEach(item => {
        const targetSlot = slotAssignments[item.Subtype];
        
        console.log(`Assigning ${item.Name} (${item.Subtype}) to slot: ${targetSlot}`);
        
        if (targetSlot) {
            StateManager.state.currentBuild.equipment[targetSlot] = item;
            equippedCount++;
            console.log(`Equipped ${item.Name} to ${targetSlot}`);
        } else {
            failedItems.push(item.Name);
            console.log(`Failed to find slot for: ${item.Name}`);
        }
    });
    
    // Restore the original function and trigger update once
    StateManager.triggerRecalculationAndUpdateUI = originalTriggerRecalc;
    StateManager.triggerRecalculationAndUpdateUI();
    
    // Update UI
    this.updateEquipmentSlots();
    
    console.log(`Final equipped count: ${equippedCount}`);
    console.log('Current equipment after set equip:', StateManager.state.currentBuild.equipment);
    
    // Expected total: other items + 1 weapon + 2 rings + 2 trinkets = 10 pieces for full sets
    const expectedTotal = otherItems.length + (weapons.length > 0 ? 1 : 0) + (rings.length > 0 ? 2 : 0) + (trinkets.length > 0 ? 2 : 0);
    
    if (equippedCount > 0) {
        if (failedItems.length > 0) {
            DOMUtils.showNotification(
                `Equipped ${equippedCount}/${expectedTotal} items from ${setData.setName}. Failed: ${failedItems.join(', ')}`, 
                'info'
            );
        } else {
            DOMUtils.showNotification(`Equipped complete ${setData.setName} set! (${equippedCount} pieces)`, 'success');
        }
    } else {
        DOMUtils.showNotification(`Could not equip any items from ${setData.setName}`, 'error');
    }
},

    /**
     * Get the appropriate slot for an item
     * @param {Object} item - Item to find slot for
     * @returns {string|null} Slot name or null
     */
    getSlotForItem(item) {
        const currentEquipment = StateManager.state.currentBuild.equipment;
        
        const slotMapping = {
            'head': 'head',
            'face': 'face',
            'shoulder': 'shoulder',
            'chest': 'chest',
            'legs': 'legs',
            'back': 'back',
            'offhand': 'offhand',
            'guild': 'guild',
            'faction': 'faction',
            'sword': 'weapon',
            'bow': 'weapon',
            'wand': 'weapon',
            'staff': 'weapon',
            'hammer': 'weapon',
            'axe': 'weapon',
            '2h sword': 'weapon'
        };
        
        // Handle single-slot items
        if (slotMapping[item.Subtype]) {
            return slotMapping[item.Subtype];
        }
        
        // Handle rings - try ring1 first, then ring2
        if (item.Subtype === 'ring') {
            if (!currentEquipment.ring1) {
                return 'ring1';
            } else if (!currentEquipment.ring2) {
                return 'ring2';
            } else {
                // Both slots occupied, replace ring1
                return 'ring1';
            }
        }
        
        // Handle trinkets - try trinket1 first, then trinket2
        if (item.Subtype === 'trinket') {
            if (!currentEquipment.trinket1) {
                return 'trinket1';
            } else if (!currentEquipment.trinket2) {
                return 'trinket2';
            } else {
                // Both slots occupied, replace trinket1
                return 'trinket1';
            }
        }
        
        return null;
    },
    
    /**
     * Update the buff grid based on current state
     */
    updateBuffGrid() {
        const activeBuffs = StateManager.state.currentBuild.activeBuffs;
        
        document.querySelectorAll('.buff-icon').forEach(icon => {
            const buffName = icon.dataset.buffName;
            const isActive = activeBuffs.some(b => b.Name === buffName);
            
            icon.classList.toggle('active', isActive);
        });
        
        this.updateBuffCount();
    },
    
    /**
     * Update the active buffs count display
     */
    updateBuffCount() {
        const activeBuffsCount = StateManager.state.currentBuild.activeBuffs.length;
        const activeBuffsCountDisplay = DOMUtils.getElement('active-buffs-count');
        if (activeBuffsCountDisplay) {
            activeBuffsCountDisplay.textContent = `(${activeBuffsCount}/5)`;
        }
    },
    
    /**
     * Handle toggling a buff on/off
     * @param {Object} buffObject - The buff object
     */
    handleToggleBuffClick(buffObject) {
        const buffElements = document.querySelectorAll(`.buff-icon[data-buff-name="${buffObject.Name}"]`);
        const isActive = buffElements.length > 0 && buffElements[0].classList.contains('active');
        
        let success = false;
        if (isActive) {
            success = StateManager.removeBuff(buffObject.Name);
        } else {
            success = StateManager.addBuff(buffObject);
            if (!success) {
                DOMUtils.showNotification("Maximum of 5 buffs allowed.", "error");
            }
        }
        
        // Update UI if state change was successful
        if (success) {
            buffElements.forEach(el => el.classList.toggle('active', !isActive));
            this.updateBuffCount();
        }
    },

    /**
     * Update spell display
     */
    updateSpellDisplay() {
        const spellSlot = DOMUtils.getElement('spell-slot');
        const spellInfo = DOMUtils.getElement('spell-info');
        
        if (!spellSlot || !spellInfo) return;
        
        const selectedSpell = StateManager.state.currentBuild.selectedSpell;
        
        UIFactory.updateSpellSlotContent(spellSlot, selectedSpell);
        
        DOMUtils.clearElement(spellInfo);
        
        if (selectedSpell) {
            const calculatedStats = StateManager.state.currentBuild.calculatedStats;
            const critPercent = calculatedStats?.finalCrit || 0;
            const dpsWithCrit = StatsCalculator.calculateSpellDpsWithCrit(selectedSpell, critPercent);
            
            const nameDiv = DOMUtils.createElement('div', {
                className: 'spell-name',
                textContent: `${selectedSpell.Name} (Tier ${selectedSpell.tier})`
            });
            
            const statsDiv = DOMUtils.createElement('div', {
                className: 'spell-stats'
            });
            
            const dpsDiv = DOMUtils.createElement('div', {
                innerHTML: `DPS: <span class="spell-dps">${dpsWithCrit}</span> (Base: ${selectedSpell.baseDps})`
            });
            
            const costDiv = DOMUtils.createElement('div', {
                innerHTML: `Cost: <span class="spell-cost">${selectedSpell.energyPerSecond.toFixed(1)} energy/sec</span>`
            });
            
            statsDiv.appendChild(dpsDiv);
            statsDiv.appendChild(costDiv);
            
            spellInfo.appendChild(nameDiv);
            spellInfo.appendChild(statsDiv);
        } else {
            const placeholderDiv = DOMUtils.createElement('div', {
                style: 'color: #666; font-style: italic;',
                textContent: 'Click to select a spell'
            });
            
            spellInfo.appendChild(placeholderDiv);
        }
    },
    
    /**
     * Open spell search
     */
    openSpellSearch() {
        const searchModal = DOMUtils.getElement('item-search-modal');
        const searchTitle = document.getElementById('search-title');
        const searchInput = DOMUtils.getElement('item-search-input');
        
        if (!searchModal) return;
        
        StateManager.setCurrentItemSearchSlot('spell');
        
        if (searchTitle) {
            searchTitle.textContent = 'Select Spell';
        }
        
        searchModal.style.display = 'flex';
        searchModal.style.top = '50%';
        searchModal.style.left = '50%';
        searchModal.style.transform = 'translate(-50%, -50%)';
        
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        
        this.populateSpellSearchResults();
    },
    
    /**
     * Populate spell search results
     */
    populateSpellSearchResults(query = '') {
        const searchResults = DOMUtils.getElement('search-results');
        if (!searchResults) return;
        
        DOMUtils.clearElement(searchResults);
        
        const spells = StateManager.state.data.spells || [];
        
        let filteredSpells = spells;
        if (query) {
            const lowerQuery = query.toLowerCase();
            filteredSpells = spells.filter(spell => 
                spell.Name.toLowerCase().includes(lowerQuery) ||
                spell.tier.toString().includes(lowerQuery)
            );
        }
        
        filteredSpells.sort((a, b) => {
            const nameComparison = a.Name.localeCompare(b.Name);
            if (nameComparison !== 0) {
                return nameComparison;
            }
            return a.tier - b.tier;
        });
        
        if (filteredSpells.length === 0) {
            searchResults.innerHTML = '<div class="search-item">No matching spells found.</div>';
        } else {
            filteredSpells.forEach(spell => {
                const spellElement = UIFactory.createSpellSearchResult(spell, (selectedSpell) => {
                    StateManager.setSelectedSpell(selectedSpell);
                    this.updateSpellDisplay();
                    this.closeItemSearch();
                    DOMUtils.showNotification(`Selected ${selectedSpell.Name}`, 'success');
                });
                
                searchResults.appendChild(spellElement);
            });
        }
    },
    
    /**
     * Restore saved page
     */
    restoreSavedPage() {
        const savedPage = StateManager.state.ui.currentPage;
        const targetButton = document.querySelector(`.nav-button[data-page="${savedPage}"]`);
        const targetPageElement = document.getElementById(`${savedPage}-page`);
        
        if (targetButton && targetPageElement) {
            document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
            targetButton.classList.add('active');
            
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            targetPageElement.classList.add('active');
            
            EventSystem.publish('page-changed', { page: savedPage });
        }
    },
    
    /**
     * Open the item search modal
     * @param {HTMLElement} slotElement - The slot element being edited
     */
    openItemSearch(slotElement) {
        const slotName = slotElement.dataset.slot;
        if (!slotName) {
            console.error("Invalid slot element: missing data-slot attribute", slotElement);
            DOMUtils.showNotification("Error: Invalid equipment slot", "error");
            return;
        }
        
        StateManager.setCurrentItemSearchSlot(slotName);
        
        const searchModal = DOMUtils.getElement('item-search-modal');
        const searchTitle = document.getElementById('search-title');
        const searchInput = DOMUtils.getElement('item-search-input');
        
        if (!searchModal) return;
        
        // Update Title
        if (searchTitle) {
            searchTitle.textContent = `Select for ${slotName.charAt(0).toUpperCase() + slotName.slice(1)}`;
        }
        
        // Position the modal
        const slotRect = slotElement.getBoundingClientRect();
        const panelWidth = 350;
        const panelHeight = 300;
        const margin = 5;
        
        let top = slotRect.bottom + margin + window.scrollY;
        let left = slotRect.left + window.scrollX;
        
        if (top + panelHeight > (window.innerHeight + window.scrollY)) {
            top = slotRect.top - panelHeight - margin + window.scrollY;
        }
        
        if (top < window.scrollY) {
            top = window.scrollY + margin;
        }
        
        if (left + panelWidth > (window.innerWidth + window.scrollX)) {
            left = window.innerWidth + window.scrollX - panelWidth - margin;
        }
        
        if (left < window.scrollX) {
            left = window.scrollX + margin;
        }
        
        searchModal.style.top = `${top}px`;
        searchModal.style.left = `${left}px`;
        searchModal.style.display = 'flex';
        
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        
        this.populateSearchResults();
    },
    
    /**
     * Close the item search modal
     */
    closeItemSearch() {
        const searchModal = DOMUtils.getElement('item-search-modal');
        if (searchModal) {
            searchModal.style.display = 'none';
        }
        
        const searchInput = DOMUtils.getElement('item-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        StateManager.setCurrentItemSearchSlot(null);
    },
    
    /**
     * Populate the search results in the item search modal
     * @param {string} [query=''] - Search query
     */
    populateSearchResults(query = '') {
    const searchResults = DOMUtils.getElement('search-results');
    if (!searchResults) return;
    
    DOMUtils.clearElement(searchResults);
    
    const currentSlot = StateManager.state.ui.currentItemSearchSlot;
    if (currentSlot === 'spell') {
        this.populateSpellSearchResults(query);
        return;
    }
    if (!currentSlot) return;
    
    const itemsState = StateManager.state.data.items;
    if (!itemsState) {
        searchResults.innerHTML = '<div class="search-item">Item data not loaded.</div>';
        return;
    }
    
    // Map slot to item type/subtype
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
    
    // Sort by level
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
        // Create item elements with requirement checking
        matchingItems.forEach(item => {
            const itemElement = UIFactory.createSearchResultItem(item, (selectedItem) => {
                const success = StateManager.equipItem(currentSlot, selectedItem);
                if (success) {
                    this.updateEquipmentSlots();
                    this.closeItemSearch();
                    DOMUtils.showNotification(`Equipped ${selectedItem.Name}`, 'success');
                } else {
                    DOMUtils.showNotification(`Requirements not met for ${selectedItem.Name}`, 'error');
                }
            });
            
            // Add item ID to the element for requirement checking
            if (item['Item ID']) {
                itemElement.dataset.itemId = item['Item ID'];
            }
            
            searchResults.appendChild(itemElement);
        });
        
        // Update display to show requirements status
        this.updateItemSearchRequirementDisplay();
    }
},
    
    /**
     * Update the performance table
     * @param {Array} performanceData - Performance data
     */
    updatePerformanceTable(performanceData) {
    const performanceTbody = DOMUtils.getElement('performance-tbody');
    if (!performanceTbody) return;
    
    DOMUtils.clearElement(performanceTbody);
    
    // Get current sort settings from state
    const state = StateManager.getState();
    const sortColumn = state.ui.performance.sortColumn;
    const sortAsc = state.ui.performance.sortAscending;
    
    // Update header sort indicators
    document.querySelectorAll('.performance-table th[data-sort]').forEach(th => {
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) {
            indicator.className = 'sort-indicator';
            
            if (th.dataset.sort === sortColumn) {
                indicator.classList.add(sortAsc ? 'asc' : 'desc');
            }
        }
    });
    
    if (!performanceData || performanceData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" style="text-align: center;">No mobs match criteria or DPS is zero.</td>';
        performanceTbody.appendChild(emptyRow);
        return;
    }
    
    // Populate table rows
    performanceData.forEach(mobPerf => {
        const row = document.createElement('tr');
        
        // Name column
        const nameCell = document.createElement('td');
        nameCell.textContent = mobPerf.name;
        row.appendChild(nameCell);
        
        // Level column
        const levelCell = document.createElement('td');
        levelCell.textContent = mobPerf.level;
        row.appendChild(levelCell);
        
        // Time to kill column
        const ttkCell = document.createElement('td');
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
        row.appendChild(ttkCell);
        
        // Gold per hour column
        const gphCell = document.createElement('td');
        gphCell.textContent = FO2Utils.formatNumber(mobPerf.gph);
        row.appendChild(gphCell);
        
        // XP per hour column
        const xphCell = document.createElement('td');
        xphCell.textContent = FO2Utils.formatNumber(mobPerf.xph);
        row.appendChild(xphCell);
        
        performanceTbody.appendChild(row);
    });
},
    
    /**
     * Handle filter slider change
     */
    handleFilterSliderChange() {
        const minLevelSlider = DOMUtils.getElement('mob-level-min-slider');
        const maxLevelSlider = DOMUtils.getElement('mob-level-max-slider');
        const minLevelDisplay = DOMUtils.getElement('min-level-display');
        const maxLevelDisplay = DOMUtils.getElement('max-level-display');
        
        if (!minLevelSlider || !maxLevelSlider) return;
        
        let minVal = parseInt(minLevelSlider.value);
        let maxVal = parseInt(maxLevelSlider.value);
        const maxMobLevel = StateManager.state.data.mobsMaxLevel;
        
        // Clamp and prevent min > max
        minVal = Math.max(1, Math.min(minVal, maxMobLevel));
        if (minVal > maxVal) minVal = maxVal;
        minLevelSlider.value = minVal;
        
        maxVal = Math.max(minVal, Math.min(maxVal, maxMobLevel));
        maxLevelSlider.value = maxVal;
        
        if (minLevelDisplay) minLevelDisplay.textContent = minVal;
        if (maxLevelDisplay) maxLevelDisplay.textContent = maxVal;
        
        // Update state
        StateManager.updatePerformanceFilters({
            minLevel: minVal,
            maxLevel: maxVal
        });
    },
    
    /**
     * Show an item tooltip
     * @param {HTMLElement} slotElement - Slot element
     */
    showItemTooltip(slotElement) {
        const slotName = slotElement.dataset.slot;
        const item = StateManager.state.currentBuild.equipment[slotName];
        if (!item) return;
        
        UIFactory.showItemTooltip(slotElement, item);
    },
    
    /**
     * Open the build details modal
     * @param {string} [buildId=null] - Build ID if editing, null if creating new
     */
    openBuildModal(buildId = null) {
        const buildDetailsModal = DOMUtils.getElement('build-details-modal');
        const modalTitleElement = document.getElementById('modal-title');
        const modalBuildIdInput = DOMUtils.getElement('modal-build-id');
        const modalBuildNameInput = DOMUtils.getElement('modal-build-name');
        const modalBuildCreatorInput = DOMUtils.getElement('modal-build-creator');
        const modalBuildDescriptionInput = DOMUtils.getElement('modal-build-description');
        
        if (!buildDetailsModal) return;
        
        const isEditing = buildId !== null;
        const build = isEditing ? StateManager.findSavedBuildById(buildId) : null;
        
        if (modalBuildIdInput) modalBuildIdInput.value = buildId || '';
        if (modalBuildNameInput) modalBuildNameInput.value = isEditing ? (build?.name || '') : '';
        if (modalBuildCreatorInput) modalBuildCreatorInput.value = isEditing ? (build?.creator || '') : '';
        if (modalBuildDescriptionInput) modalBuildDescriptionInput.value = isEditing ? (build?.description || '') : '';
        if (modalTitleElement) modalTitleElement.textContent = isEditing ? 'Edit Build Details' : 'Save New Build';
        
        buildDetailsModal.style.display = 'flex';
        if (modalBuildNameInput) modalBuildNameInput.focus();
    },
    
    /**
     * Close the build details modal
     */
    closeBuildModal() {
        const buildDetailsModal = DOMUtils.getElement('build-details-modal');
        if (buildDetailsModal) {
            buildDetailsModal.style.display = 'none';
        }
    },
    
    /**
     * Handle saving build details
     */
    handleSaveBuildDetails() {
        const modalBuildIdInput = DOMUtils.getElement('modal-build-id');
        const modalBuildNameInput = DOMUtils.getElement('modal-build-name');
        const modalBuildCreatorInput = DOMUtils.getElement('modal-build-creator');
        const modalBuildDescriptionInput = DOMUtils.getElement('modal-build-description');
        
        if (!modalBuildNameInput) return;
        
        const buildId = modalBuildIdInput ? modalBuildIdInput.value : null;
        const name = modalBuildNameInput.value.trim() || 'Unnamed Build';
        const creator = modalBuildCreatorInput ? modalBuildCreatorInput.value.trim() : '';
        const description = modalBuildDescriptionInput ? 
            modalBuildDescriptionInput.value.trim().substring(0, FO2Config.UI.MAX_BUILD_DESCRIPTION_LENGTH) : '';
        
        if (buildId) {
            // Editing existing
            const success = StateManager.updateSavedBuild(buildId, { name, creator, description });
            if (success) {
                DOMUtils.showNotification(`Build "${name}" details updated.`, 'success');
            } else {
                DOMUtils.showNotification(`Error updating build ID ${buildId}.`, 'error');
            }
        } else {
            // Saving new build from current editor state
            const newBuildData = {
                id: FO2Utils.generateId(),
                name: name,
                creator: creator,
                description: description,
                level: StateManager.state.currentBuild.level,
                rebirth: StateManager.state.currentBuild.rebirth,
                stats: { ...StateManager.state.currentBuild.statPoints },
                equipment: {},
                activeBuffNames: StateManager.state.currentBuild.activeBuffs.map(b => b.Name),
                uiPerformance: { ...StateManager.state.ui.performance }
            };
            
            // Populate equipment IDs
            for (const slot in StateManager.state.currentBuild.equipment) {
                if (StateManager.state.currentBuild.equipment[slot]) {
                    newBuildData.equipment[slot] = StateManager.state.currentBuild.equipment[slot]['Item ID'];
                }
            }
            
            StateManager.addSavedBuild(newBuildData);
            DOMUtils.showNotification(`Build "${name}" saved.`, 'success');
        }
        
        this.displaySavedBuilds();
        this.closeBuildModal();
    },
    
    /**
     * Display saved builds in the build management page
     */
    displaySavedBuilds() {
        const savedBuildsListContainer = DOMUtils.getElement('saved-builds-list');
        if (!savedBuildsListContainer) return;
        
        DOMUtils.clearElement(savedBuildsListContainer);
        
        const builds = StateManager.state.savedBuilds;
        
        if (!builds || builds.length === 0) {
            savedBuildsListContainer.innerHTML = '<div class="empty-message">No saved builds.</div>';
            return;
        }
        
        builds.forEach(build => {
            // Calculate stats for this saved build
            const calculatedStats = StatsCalculator.calculateStatsForSavedBuildObject(
                build, 
                { itemsById: StateManager.state.data.itemsById, buffs: StateManager.state.data.buffs },
                FO2Config
            );
            
            const buildElement = UIFactory.createSavedBuildItem(
                build, 
                calculatedStats,
                { 
                    itemsById: StateManager.state.data.itemsById,
                    buffs: StateManager.state.data.buffs
                }
            );
            
            savedBuildsListContainer.appendChild(buildElement);
        });
    },
    
    /* Populate the item dictionary grid */
    populateItemDictionaryGrid() {
        const itemDictionaryGrid = DOMUtils.getElement('item-dictionary-grid');
        if (!itemDictionaryGrid) return;
        
        DOMUtils.clearElement(itemDictionaryGrid);
        
        if (!StateManager.state.data.itemsById || StateManager.state.data.itemsById.size === 0) {
            itemDictionaryGrid.innerHTML = '<p class="empty-message">No item data loaded.</p>';
            return;
        }
        
        const filters = StateManager.state.ui.itemDictionary;
        let filteredItems = Array.from(StateManager.state.data.itemsById.values());
        
        // Filter by Search Term
        if (filters.search) {
            filteredItems = filteredItems.filter(item => 
                item.Name?.toLowerCase().includes(filters.search)
            );
        }
        
        // Filter by Category
        if (filters.category !== 'all') {
            const [typeFilter, subtypeFilter] = filters.category.split('-');
            filteredItems = filteredItems.filter(item => {
                const itemType = item.Type?.toLowerCase();
                const itemSubtype = item.Subtype?.toLowerCase().replace(/\s+/g, '_');
                if (itemType !== typeFilter) return false;
                if (subtypeFilter !== 'all' && itemSubtype !== subtypeFilter) return false;
                return true;
            });
        }
        
        // Sort Items - UPDATED for multi-sort functionality
        filteredItems.sort((a, b) => {
            const activeSorts = filters.activeSorts || [];
                if (activeSorts.length === 0) {
                    return 0; // No sorting - maintain original order
                }
            
            // Apply each sort in priority order
            for (const sort of activeSorts) {
                let valA, valB, comparison = 0;
                
                switch (sort.criteria) {
                    case 'name':
                        valA = a.Name?.toLowerCase() || '';
                        valB = b.Name?.toLowerCase() || '';
                        comparison = sort.ascending ? 
                            valA.localeCompare(valB) : 
                            valB.localeCompare(valA);
                        break;
                    case 'STR':
                    case 'AGI':
                    case 'STA':
                    case 'INT':
                        // Handle stat sorting - items without the stat are treated as 0
                        valA = parseInt(a[sort.criteria]) || 0;
                        valB = parseInt(b[sort.criteria]) || 0;
                        comparison = sort.ascending ? 
                            valA - valB : 
                            valB - valA;
                        break;
                    case 'level':
                    default:
                        valA = a.Level || 0;
                        valB = b.Level || 0;
                        comparison = sort.ascending ? 
                            valA - valB : 
                            valB - valA;
                        break;
                }
                
                // If this sort produces a meaningful difference, use it
                if (comparison !== 0) {
                    return comparison;
                }
                
                // If values are equal, continue to next sort criteria
            }
            
            // If all sorts result in equality, maintain original order
            return 0;
        });
        
        // Render Grid Items
        if (filteredItems.length === 0) {
            itemDictionaryGrid.innerHTML = '<p class="empty-message">No items match criteria.</p>';
        } else {
            filteredItems.forEach(item => {
                const iconElement = UIFactory.createItemGridIcon(item, (selectedItem) => {
                    this.displayItemInViewer(selectedItem);
                });
                
                itemDictionaryGrid.appendChild(iconElement);
            });
        }
    },
    
    /**
     * Display an item in the item viewer (Enhanced with edit capability)
     * @param {Object} item - Item to display
     */
    displayItemInViewer(item) {
        const itemDictionaryViewer = DOMUtils.getElement('item-dictionary-viewer');
        if (!itemDictionaryViewer) return;
        
        const container = document.createElement('div');
        
        if (!item) {
            container.innerHTML = '<p class="empty-message">Select an item.</p>';
            itemDictionaryViewer.appendChild(container);
            return;
        }

        let isEditing = false;

        const renderView = () => {
            DOMUtils.clearElement(container);
            
            if (isEditing) {
                const editor = ItemEditor.createItemEditor(
                    item,
                    (updatedItem) => {
                        // Update the item in the data store
                        StateManager.state.data.itemsById.set(updatedItem['Item ID'], updatedItem);
                        
                        // Reprocess items to update categories
                        const allItems = Array.from(StateManager.state.data.itemsById.values());
                        const processedData = DataService.processItemData(allItems);
                        StateManager.state.data.items = processedData.items;
                        
                        // Update the item reference and switch back to view mode
                        Object.assign(item, updatedItem);
                        isEditing = false;
                        renderView();
                        
                        // Refresh the grid
                        this.populateItemDictionaryGrid();
                        
                        DOMUtils.showNotification(`${updatedItem.Name} updated successfully!`, 'success');
                    },
                    () => {
                        isEditing = false;
                        renderView();
                    }
                );
                container.appendChild(editor);
            } else {
                // Regular view with edit button
                const viewContent = UIFactory.createItemDetailView(item);
                
                const editButton = DOMUtils.createElement('button', {
                    textContent: 'Edit Item',
                    className: 'action-button positive',
                    style: { marginTop: '10px' },
                    onclick: () => {
                        isEditing = true;
                        renderView();
                    }
                });
                
                container.appendChild(viewContent);
                container.appendChild(editButton);
            }
        };

        renderView();
        DOMUtils.clearElement(itemDictionaryViewer);
        itemDictionaryViewer.appendChild(container);
    },
    
    /**
     * Populate item category filter dropdown
     */
    populateItemCategoryFilter() {
        const itemDictionaryCategoryFilter = DOMUtils.getElement('item-dictionary-category-filter');
        if (!itemDictionaryCategoryFilter || !StateManager.state.data.itemsById || StateManager.state.data.itemsById.size === 0) return;
        
        const categoriesMap = new Map();
        
        StateManager.state.data.itemsById.forEach(item => {
            const type = item.Type?.trim();
            const subtype = item.Subtype?.trim();
            
            if (type) {
                if (!categoriesMap.has(type)) categoriesMap.set(type, new Set());
                if (subtype) categoriesMap.get(type).add(subtype);
            }
        });
        
        // Clear existing options (keep "All Categories")
        while (itemDictionaryCategoryFilter.options.length > 1) {
            itemDictionaryCategoryFilter.remove(1);
        }
        
        const sortedTypes = Array.from(categoriesMap.keys()).sort();
        
        sortedTypes.forEach(typeName => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = typeName.charAt(0).toUpperCase() + typeName.slice(1);
            itemDictionaryCategoryFilter.appendChild(optgroup);
            
            // "All [Type]" option
            const allOfTypeOption = document.createElement('option');
            allOfTypeOption.value = `${typeName.toLowerCase()}-all`;
            allOfTypeOption.textContent = `All ${optgroup.label}`;
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
    },

    /**
     * Update mode-related UI elements
     * @param {string} mode - Current mode
     */
    updateModeDisplay(mode) {
        const modeToggleSwitch = DOMUtils.getElement('mode-toggle');
        const modeLabel = DOMUtils.getElement('mode-display');
        
        if (modeToggleSwitch) {
            modeToggleSwitch.checked = (mode === FO2Config.UI.MODE.RESTRICTED);
        }
        
        if (modeLabel) {
            modeLabel.textContent = mode === FO2Config.UI.MODE.RESTRICTED
                ? 'Restricted'
                : 'Sandbox';
        }
        
        // Update item search UI to show requirements status
        this.updateItemSearchRequirementDisplay();
    },

    /**
     * Update search results to show requirement status
     */
    updateItemSearchRequirementDisplay() {
    if (StateManager.state.ui.mode !== FO2Config.UI.MODE.RESTRICTED) return;
    
    const searchResults = document.querySelectorAll('.search-item');
    const currentSlot = StateManager.state.ui.currentItemSearchSlot;
    if (!currentSlot) return;
    
    // Create a temporary state that includes the stats with current equipment
    // This simulates what stats will be after equipping the item
    const tempState = FO2Utils.deepClone(StateManager.state.currentBuild);
    
    // If we have an item in the target slot, remove it first to simulate replacing it
    if (tempState.equipment[currentSlot]) {
        // Remove the current item's stats before calculating
        tempState.equipment[currentSlot] = null;
    }
    
    // Calculate stats without anything in the target slot
    const tempStats = StatsCalculator.performFullStatCalculation(tempState, FO2Config).finalStats;
    
    searchResults.forEach(resultElement => {
        const itemId = resultElement.dataset.itemId;
        if (!itemId) return;
        
        const item = StateManager.state.data.itemsById.get(itemId);
        if (!item) return;
        
        // Check requirements against calculated stats (without the current item in slot)
        const failsRequirements = (
            (item['Req STR'] && tempStats.str < item['Req STR']) ||
            (item['Req INT'] && tempStats.int < item['Req INT']) ||
            (item['Req AGI'] && tempStats.agi < item['Req AGI']) ||
            (item['Req STA'] && tempStats.sta < item['Req STA'])
        );
        
        resultElement.classList.toggle('requirements-not-met', failsRequirements);
    });
},

    /**
     * Update set bonuses display
     */
    updateSetBonusesDisplay() {
        const setBonusesContainer = DOMUtils.getElement('active-set-bonuses');
        if (!setBonusesContainer) return;
        
        DOMUtils.clearElement(setBonusesContainer);
        
        const equipment = StateManager.state.currentBuild.equipment;
        const setsByName = StateManager.state.data.setsByName;
        
        if (!equipment || !setsByName) return;
        
        // Count equipped items by set
        const setCounts = new Map();
        
        Object.values(equipment).forEach(item => {
            if (item && item.setName) {
                const currentCount = setCounts.get(item.setName) || 0;
                setCounts.set(item.setName, currentCount + 1);
            }
        });
        
        // Filter out sets that don't have any active bonuses
        const setsWithActiveBonuses = new Map();
        
        setCounts.forEach((count, setName) => {
            const setData = setsByName.get(setName);
            if (setData && setData.bonuses) {
                // Check if this set has any bonus tiers that the current count qualifies for
                const availableTiers = Object.keys(setData.bonuses)
                    .map(tier => parseInt(tier))
                    .filter(tier => tier <= count);
                
                // Only add to display if there are qualifying tiers
                if (availableTiers.length > 0) {
                    setsWithActiveBonuses.set(setName, count);
                }
            }
        });
        
        if (setsWithActiveBonuses.size === 0) {
            setBonusesContainer.innerHTML = '<div class="no-sets">No set bonuses active</div>';
            return;
        }
        
        // Display each set with active bonuses
        setsWithActiveBonuses.forEach((count, setName) => {
            const setData = setsByName.get(setName);
            if (setData) {
                const setDisplay = UIFactory.createSetBonusDisplay(setName, count, setData);
                setBonusesContainer.appendChild(setDisplay);
            }
        });
    },

    /**
     * Update sort buttons display based on current state
     */
    updateSortButtonsDisplay() {
        const activeSorts = StateManager.state.ui.itemDictionary.activeSorts || [];
        const buttons = document.querySelectorAll('.sort-button[data-sort]');
        
        buttons.forEach(button => {
            const sortType = button.dataset.sort;
            const sortIndex = activeSorts.findIndex(sort => sort.criteria === sortType);
            
            // Reset all classes
            button.classList.remove('active', 'asc', 'desc', 'primary', 'secondary', 'tertiary');
            
            const prioritySpan = button.querySelector('.sort-priority');
            const indicatorSpan = button.querySelector('.sort-indicator');
            
            if (sortIndex !== -1) {
                // This sort is active
                const sort = activeSorts[sortIndex];
                button.classList.add('active');
                button.classList.add(sort.ascending ? 'asc' : 'desc');
                
                // Add priority class based on order
                if (sortIndex === 0) button.classList.add('primary');
                else if (sortIndex === 1) button.classList.add('secondary');
                else if (sortIndex === 2) button.classList.add('tertiary');
                
                // Show priority number
                if (prioritySpan) {
                    prioritySpan.textContent = sortIndex + 1;
                }
            } else {
                // Sort is not active
                if (prioritySpan) {
                    prioritySpan.textContent = '';
                }
            }
        });
    },

};

const ItemEditor = {
    /**
     * Creates an editable item details view
     * @param {Object} item - The item to edit
     * @param {Function} onSave - Callback when item is saved
     * @param {Function} onCancel - Callback when editing is cancelled
     * @returns {HTMLElement} The editor element
     */
    createItemEditor(item, onSave, onCancel) {
        const container = DOMUtils.createElement('div', {
            className: 'item-editor-container'
        });

        const form = DOMUtils.createElement('form', {
            className: 'item-editor-form'
        });

        // Create form fields for each editable property - UPDATED with new fields
        const fields = [
            { key: 'Name', label: 'Name', type: 'text', required: true },
            { key: 'Level', label: 'Level', type: 'number', min: 0 },
            { key: 'Type', label: 'Type', type: 'select', options: ['weapon', 'equipment'] },
            { key: 'Subtype', label: 'Subtype', type: 'text' },
            { key: 'STA', label: 'STA', type: 'number' },
            { key: 'STR', label: 'STR', type: 'number' },
            { key: 'INT', label: 'INT', type: 'number' },
            { key: 'AGI', label: 'AGI', type: 'number' },
            { key: 'Req STA', label: 'Req STA', type: 'number', min: 0 },
            { key: 'Req STR', label: 'Req STR', type: 'number', min: 0 },
            { key: 'Req INT', label: 'Req INT', type: 'number', min: 0 },
            { key: 'Req AGI', label: 'Req AGI', type: 'number', min: 0 },
            { key: 'Armor', label: 'Armor', type: 'number' },
            { key: 'Direct Crit', label: 'Crit (%)', type: 'number', step: 0.1, min: 0, placeholder: '0.0' }, // NEW
            { key: 'Direct ATK Power', label: 'Direct ATK Power', type: 'number', min: 0, placeholder: '0' }, // NEW
            { key: 'Damage', label: 'Damage', type: 'text', placeholder: 'e.g., 10-20 or 5K-10K' },
            { key: 'Atk Spd', label: 'Attack Speed (ms)', type: 'number', min: 100 },
            { key: 'Sprite-Link', label: 'Sprite URL', type: 'url' }
        ];

        const formContent = DOMUtils.createElement('div', {
            className: 'item-editor-fields'
        });

        fields.forEach(field => {
            const fieldContainer = DOMUtils.createElement('div', {
                className: 'form-field'
            });

            const label = DOMUtils.createElement('label', {
                textContent: field.label + ':',
                className: 'field-label'
            });

            let input;
            if (field.type === 'select') {
                input = DOMUtils.createElement('select', {
                    name: field.key,
                    className: 'field-input'
                });
                
                field.options.forEach(option => {
                    const optionEl = DOMUtils.createElement('option', {
                        value: option,
                        textContent: option,
                        selected: item[field.key] === option
                    });
                    input.appendChild(optionEl);
                });
            } else {
                input = DOMUtils.createElement('input', {
                    type: field.type,
                    name: field.key,
                    value: item[field.key] || '',
                    className: 'field-input',
                    placeholder: field.placeholder || '',
                    min: field.min !== undefined ? field.min : undefined,
                    step: field.step !== undefined ? field.step : undefined, // NEW: Add step support for decimals
                    required: field.required || false
                });
            }

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);
            formContent.appendChild(fieldContainer);
        });

        const buttonContainer = DOMUtils.createElement('div', {
            className: 'item-editor-buttons'
        });

        const saveButton = DOMUtils.createElement('button', {
            type: 'submit',
            textContent: 'Save Changes',
            className: 'action-button positive'
        });

        const cancelButton = DOMUtils.createElement('button', {
            type: 'button',
            textContent: 'Cancel',
            className: 'action-button',
            onclick: onCancel
        });

        const exportButton = DOMUtils.createElement('button', {
            type: 'button',
            textContent: 'Export JSON',
            className: 'action-button',
            onclick: () => this.exportSingleItem(item)
        });

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(exportButton);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedItem = { ...item };

            // Update item properties from form - UPDATED to handle new fields
            for (const [key, value] of formData.entries()) {
                if (value === '') {
                    updatedItem[key] = '';
                } else if (['Level', 'STA', 'STR', 'INT', 'AGI', 'Req STA', 'Req STR', 'Req INT', 'Req AGI', 'Armor', 'Atk Spd', 'Direct ATK Power'].includes(key)) {
                    updatedItem[key] = parseInt(value) || 0;
                } else if (key === 'Direct Crit') { // NEW: Handle Direct Crit as float
                    updatedItem[key] = parseFloat(value) || 0;
                } else {
                    updatedItem[key] = value;
                }
            }

            onSave(updatedItem);
        });

        form.appendChild(formContent);
        form.appendChild(buttonContainer);
        container.appendChild(form);

        return container;
    },

    /**
     * Export a single item as JSON
     */
    exportSingleItem(item) {
        const jsonStr = JSON.stringify(item, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.Name || 'item'}_${item['Item ID']}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Export all items as JSON
     */
    exportAllItems() {
        const allItems = Array.from(StateManager.state.data.itemsById.values());
        const jsonStr = JSON.stringify(allItems, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'items_modified.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Import items from JSON file
     */
    importItems() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const items = JSON.parse(e.target.result);
                    if (Array.isArray(items)) {
                        // Process and update the items
                        const processedData = DataService.processItemData(items);
                        StateManager.state.data.items = processedData.items;
                        StateManager.state.data.itemsById = processedData.itemsById;
                        
                        // Update UI
                        UIController.populateItemDictionaryGrid();
                        UIController.populateItemCategoryFilter();
                        
                        DOMUtils.showNotification('Items imported successfully!', 'success');
                    } else {
                        throw new Error('Invalid JSON format');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    DOMUtils.showNotification('Error importing items: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }
};
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Loaded. Starting initialization...");
    try {
        // Show loading notification
        DOMUtils.showNotification("Loading game data...", "info");
        
        // Initialize State Manager first (loads data and saved state)
        await StateManager.initialize();
        
        // Initialize UI Controller (sets up event listeners and initial UI state)
        UIController.initialize();
        
        // Final UI setup after loading
        UIController.populateItemCategoryFilter();
        
        console.log("Application initialized successfully.");
        DOMUtils.showNotification("Application loaded successfully!", "success");
    } catch (error) {
        console.error("CRITICAL INITIALIZATION ERROR:", error);
        DOMUtils.showNotification(
            `Failed to initialize application: ${error.message}. Check console.`, 
            "error"
        );
        
        // Display error in the UI
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.innerHTML = `
                <div class="init-error">
                    <h2>Application Failed to Load</h2>
                    <p>Error: ${error.message}</p>
                    <p>Please check the browser console (F12) for details.</p>
                </div>
            `;
        }
    }
});