const GAME_DATA = {
    xpLevels: [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 8000, 12000, 18000],
    
    woodcutting: [
        { id: 'tree_normal', name: 'Árvore Comum', reqLevel: 1, xp: 10, time: 3.0, drop: 'wood', dropChance: 1.0 },
        { id: 'tree_oak', name: 'Carvalho Escuro', reqLevel: 5, xp: 25, time: 5.0, drop: 'oak', dropChance: 1.0 },
        { id: 'tree_magic', name: 'Árvore Anciã', reqLevel: 10, xp: 80, time: 8.0, drop: 'magic_wood', dropChance: 1.0 }
    ],

    mining: [
        { id: 'rock_copper', name: 'Veta de Cobre', reqLevel: 1, xp: 12, time: 3.5, drop: 'copper_ore', dropChance: 1.0 },
        { id: 'rock_iron', name: 'Veta de Ferro', reqLevel: 5, xp: 30, time: 6.0, drop: 'iron_ore', dropChance: 1.0 },
        { id: 'rock_mithril', name: 'Veta de Mithril', reqLevel: 10, xp: 90, time: 10.0, drop: 'mithril_ore', dropChance: 1.0 }
    ],

    fishing: [
        { id: 'fish_shrimp', name: 'Camarão', reqLevel: 1, xp: 15, time: 4.0, drop: 'raw_shrimp', dropChance: 0.8 },
        { id: 'fish_salmon', name: 'Salmão', reqLevel: 5, xp: 35, time: 6.5, drop: 'raw_salmon', dropChance: 0.7 }
    ],

    cooking: [
        { id: 'cook_shrimp', name: 'Assar Camarão', reqLevel: 1, xp: 20, time: 3.0, reqItem: 'raw_shrimp', drop: 'cooked_shrimp', heal: 20 },
        { id: 'cook_salmon', name: 'Assar Salmão', reqLevel: 5, xp: 45, time: 4.5, reqItem: 'raw_salmon', drop: 'cooked_salmon', heal: 50 }
    ],

    smithing: [
        { id: 'smelt_copper', name: 'Barra de Cobre', reqLevel: 1, xp: 15, time: 3.0, reqItem: 'copper_ore', reqCost: 1, drop: 'copper_bar' },
        { id: 'smelt_iron', name: 'Barra de Ferro', reqLevel: 5, xp: 35, time: 5.0, reqItem: 'iron_ore', reqCost: 2, drop: 'iron_bar' }
    ],

    enemies: [
        { id: 'goblin', name: 'Goblin Fraco', hp: 30, dmg: [1, 3], xp: 15, goldDrop: [2, 5], reqLevel: 1 },
        { id: 'orc', name: 'Orc Brutal', hp: 100, dmg: [4, 8], xp: 45, goldDrop: [10, 25], reqLevel: 5 },
        { id: 'dragon', name: 'Dragão Jovem', hp: 350, dmg: [12, 25], xp: 120, goldDrop: [50, 100], reqLevel: 10 }
    ],

    companions: [
        { id: 'pet_wolf', name: 'Lobo Feroz', desc: 'Ataca o inimigo a cada 5s (Dano: 5)', cost: { gold: 500 }, tickTime: 5.0, type: 'combat', dmg: 5 },
        { id: 'pet_miner', name: 'Anão Minerador', desc: 'Minera Cobre passivamente (1/min)', cost: { gold: 1000 }, tickTime: 60.0, type: 'gather', resource: 'copper_ore', amount: 1 },
        { id: 'pet_lumber', name: 'Lenhador Golem', desc: 'Corta Madeira passivamente (1/min)', cost: { gold: 1000 }, tickTime: 60.0, type: 'gather', resource: 'wood', amount: 1 }
    ],

    upgrades: [
        { id: 'upg_backpack', name: 'Mochila de Aventureiro', desc: '+1 slot de coleta por Tick', cost: 1000 },
        { id: 'upg_boots', name: 'Botas de Agilidade', desc: 'Reduz o tempo de todas as ações em 10%', cost: 2500 },
        { id: 'upg_luck', name: 'Trevo de Quatro Folhas', desc: '5% de chance de loot duplo', cost: 5000 }
    ],

    prices: {
        wood: 1, oak: 3, magic_wood: 15,
        copper_ore: 2, iron_ore: 5, mithril_ore: 20,
        raw_shrimp: 2, raw_salmon: 6,
        cooked_shrimp: 4, cooked_salmon: 12,
        copper_bar: 5, iron_bar: 15
    },

    magic: [
        { id: 'spell_fireball', name: 'Bola de Fogo', desc: 'Causa 30 de dano instantâneo', cooldown: 10.0, manaCost: 0, effect: 'dmg', val: 30, reqLevel: 1 },
        { id: 'spell_heal', name: 'Cura Menor', desc: 'Cura 50 de HP', cooldown: 15.0, manaCost: 0, effect: 'heal', val: 50, reqLevel: 3 }
    ]
};
