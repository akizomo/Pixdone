/**
 * FeelDone - Encouraging Messages Module
 * Contains all the friendly, supportive messages shown when tasks are completed
 */

const celebrationMessages = {
    // General completion messages
    general: [
        {
            message: "Nice! You cleared it like a ninja.",
            subtitle: "Smooth moves! 🥷"
        },
        {
            message: "That one was a tough cookie. But you nailed it!",
            subtitle: "You're unstoppable! 🍪"
        },
        {
            message: "Take a breath. That was a big one.",
            subtitle: "You earned this moment 🌟"
        },
        {
            message: "Look at you go! Another one down.",
            subtitle: "You're on fire today! 🔥"
        },
        {
            message: "Boom! Another victory for you.",
            subtitle: "Keep that momentum going! 💪"
        },
        {
            message: "You're making magic happen!",
            subtitle: "One task at a time ✨"
        },
        {
            message: "High five! You crushed it.",
            subtitle: "Your future self thanks you! 🙌"
        },
        {
            message: "That felt good, didn't it?",
            subtitle: "Sweet satisfaction! 😊"
        },
        {
            message: "You're like a productivity superhero!",
            subtitle: "Saving the day, one task at a time! 🦸‍♀️"
        },
        {
            message: "Ding! Achievement unlocked.",
            subtitle: "You're leveling up! 🎮"
        },
        {
            message: "Another step closer to your goals!",
            subtitle: "Progress is progress! 🎯"
        },
        {
            message: "You make it look so easy!",
            subtitle: "But we know you're working hard! 💼"
        },
        {
            message: "That's what I call getting things done!",
            subtitle: "You're a natural! 🌟"
        },
        {
            message: "Woohoo! Another win for team you!",
            subtitle: "Keep celebrating the small wins! 🎉"
        },
        {
            message: "You're on a roll today!",
            subtitle: "Nothing can stop you now! 🎲"
        }
    ],

    // Priority-specific messages
    highPriority: [
        {
            message: "Whoa! That was a big one!",
            subtitle: "You tackled it like a champion! 🏆"
        },
        {
            message: "Major task = Major victory!",
            subtitle: "You should feel proud! 🎖️"
        },
        {
            message: "You just conquered Mount Everest!",
            subtitle: "High-priority task demolished! 🏔️"
        },
        {
            message: "That was no small feat!",
            subtitle: "You're incredible! 💪"
        },
        {
            message: "Heavy lifting complete!",
            subtitle: "Time to celebrate! 🎊"
        }
    ],

    mediumPriority: [
        {
            message: "Steady progress, steady wins!",
            subtitle: "You're building momentum! 📈"
        },
        {
            message: "Nice work on that one!",
            subtitle: "Every task counts! ⭐"
        },
        {
            message: "Another solid completion!",
            subtitle: "You're so reliable! 🤝"
        },
        {
            message: "Keep that energy flowing!",
            subtitle: "You're in the zone! ⚡"
        }
    ],

    lowPriority: [
        {
            message: "Small steps, big dreams!",
            subtitle: "Every little bit helps! 👟"
        },
        {
            message: "Ticked off like a pro!",
            subtitle: "No task too small! ✅"
        },
        {
            message: "Quick and clean!",
            subtitle: "Efficiency at its finest! 🎯"
        },
        {
            message: "Easy peasy, lemon squeezy!",
            subtitle: "You make it look effortless! 🍋"
        }
    ],

    // Category-specific messages
    work: [
        {
            message: "Professional level: Expert!",
            subtitle: "Crushing it at work! 💼"
        },
        {
            message: "Boss mode: Activated!",
            subtitle: "Your colleagues would be impressed! 👔"
        },
        {
            message: "Work-life balance champion!",
            subtitle: "Getting things done right! ⚖️"
        },
        {
            message: "Career goals in progress!",
            subtitle: "You're building something great! 🚀"
        }
    ],

    personal: [
        {
            message: "Self-care level: Amazing!",
            subtitle: "You're taking care of yourself! 🌱"
        },
        {
            message: "Personal growth unlocked!",
            subtitle: "You're investing in yourself! 📚"
        },
        {
            message: "Life admin: Handled!",
            subtitle: "You're so organized! 📋"
        },
        {
            message: "Future you is grateful!",
            subtitle: "Taking care of personal stuff! 🙏"
        }
    ],

    shopping: [
        {
            message: "Shopping list: Conquered!",
            subtitle: "No more forgetting milk! 🥛"
        },
        {
            message: "Retail therapy complete!",
            subtitle: "Mission accomplished! 🛍️"
        },
        {
            message: "Cart to completion!",
            subtitle: "You're so prepared! 🛒"
        },
        {
            message: "Supplies secured!",
            subtitle: "Ready for anything! 📦"
        }
    ],

    // Time-based messages
    morning: [
        {
            message: "Early bird catches the worm!",
            subtitle: "Starting strong today! 🌅"
        },
        {
            message: "Good morning, achiever!",
            subtitle: "What a productive start! ☀️"
        },
        {
            message: "Rise and grind complete!",
            subtitle: "You're ahead of the game! 🌄"
        }
    ],

    afternoon: [
        {
            message: "Midday momentum!",
            subtitle: "Keeping the energy up! 🌤️"
        },
        {
            message: "Afternoon achievement!",
            subtitle: "No slowing down! 🚀"
        },
        {
            message: "Lunch break productivity!",
            subtitle: "Making every moment count! 🍽️"
        }
    ],

    evening: [
        {
            message: "Evening excellence!",
            subtitle: "Ending the day strong! 🌆"
        },
        {
            message: "Sunset success!",
            subtitle: "Beautiful way to wrap up! 🌇"
        },
        {
            message: "Night owl in action!",
            subtitle: "Getting things done! 🦉"
        }
    ],

    // Streak messages (when multiple tasks completed)
    streak: [
        {
            message: "You're on fire today!",
            subtitle: "Multiple tasks completed! 🔥"
        },
        {
            message: "Productivity machine activated!",
            subtitle: "Can't stop, won't stop! ⚙️"
        },
        {
            message: "Task-completing champion!",
            subtitle: "You're unstoppable! 🏆"
        },
        {
            message: "Efficiency expert at work!",
            subtitle: "Look at you go! 💨"
        },
        {
            message: "Multi-tasking master!",
            subtitle: "One after another! 🎯"
        }
    ],

    // Special occasion messages
    firstTask: [
        {
            message: "Welcome to FeelDone!",
            subtitle: "Your first task is complete! 🎉"
        },
        {
            message: "And so it begins!",
            subtitle: "First of many victories! 🌟"
        },
        {
            message: "You've taken the first step!",
            subtitle: "Every journey starts with one! 👣"
        }
    ],

    // Overdue task completed
    overdue: [
        {
            message: "Better late than never!",
            subtitle: "You tackled that overdue task! ⏰"
        },
        {
            message: "Back on track!",
            subtitle: "Catching up feels good! 🛤️"
        },
        {
            message: "Overdue but not forgotten!",
            subtitle: "You came back for it! 🔄"
        },
        {
            message: "Fashionably late completion!",
            subtitle: "But you still got it done! 💃"
        }
    ],

    // Weekend messages
    weekend: [
        {
            message: "Weekend warrior!",
            subtitle: "Even on weekends, you're productive! 🏖️"
        },
        {
            message: "Saturday/Sunday success!",
            subtitle: "No rest for the accomplished! 🎯"
        },
        {
            message: "Weekend vibes with results!",
            subtitle: "Balancing fun and productivity! 🎮"
        }
    ]
};

// Time-based message selection
function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}

// Day-based message selection
function isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6;
}

// Get appropriate message based on task context
function getCelebrationMessage(task, context = {}) {
    const { isFirstTask = false, isStreak = false, completedCount = 0 } = context;
    
    let messagePool = [];
    
    // Special cases first
    if (isFirstTask) {
        messagePool = celebrationMessages.firstTask;
    } else if (isStreak && completedCount > 2) {
        messagePool = celebrationMessages.streak;
    } else if (isWeekend()) {
        messagePool = celebrationMessages.weekend;
    } else if (task.dueDate && new Date(task.dueDate) < new Date()) {
        messagePool = celebrationMessages.overdue;
    } else {
        // Build message pool based on context
        
        // Add time-based messages
        const timeOfDay = getTimeOfDay();
        if (celebrationMessages[timeOfDay]) {
            messagePool = [...messagePool, ...celebrationMessages[timeOfDay]];
        }
        
        // Add category-specific messages
        if (task.category && celebrationMessages[task.category]) {
            messagePool = [...messagePool, ...celebrationMessages[task.category]];
        }
        
        // Add priority-specific messages
        if (task.priority && celebrationMessages[task.priority + 'Priority']) {
            messagePool = [...messagePool, ...celebrationMessages[task.priority + 'Priority']];
        }
        
        // Always include general messages
        messagePool = [...messagePool, ...celebrationMessages.general];
    }
    
    // Return random message from pool
    const randomIndex = Math.floor(Math.random() * messagePool.length);
    return messagePool[randomIndex];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        celebrationMessages,
        getCelebrationMessage,
        getTimeOfDay,
        isWeekend
    };
}
