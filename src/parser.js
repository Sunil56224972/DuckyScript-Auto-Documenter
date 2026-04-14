/**
 * DuckyScript Parser for Enterprise Documentation
 * Maps raw commands to readable corporate steps.
 */

export const DuckyParser = {
    commands: {
        'REM': { label: 'Comment', icon: 'message-square', desc: (args) => args || 'Author annotation' },
        'DELAY': { label: 'Wait', icon: 'clock', desc: (args) => `Pause execution for ${args / 1000} seconds` },
        'STRING': { label: 'Type Text', icon: 'type', desc: (args) => `Inputs string: "${args}"` },
        'GUI': { label: 'System Command', icon: 'terminal', desc: (args) => `Trigger System (${args}) shortcut` },
        'WINDOWS': { label: 'System Command', icon: 'terminal', desc: (args) => `Trigger System (${args}) shortcut` },
        'ENTER': { label: 'Action', icon: 'corner-down-left', desc: () => 'Simulate Enter key press' },
        'TAB': { label: 'Navigation', icon: 'arrow-right-circle', desc: () => 'Simulate Tab key press' },
        'SPACE': { label: 'Action', icon: 'space', desc: () => 'Simulate Space key press' },
        'ESCAPE': { label: 'Action', icon: 'x-circle', desc: () => 'Simulate Escape key press' },
        'MENU': { label: 'Action', icon: 'menu', desc: () => 'Trigger Context Menu' },
        'APP': { label: 'Action', icon: 'menu', desc: () => 'Trigger Context Menu' },
        'SHIFT': { label: 'Modifier', icon: 'arrow-up', desc: (args) => `Hold SHIFT + ${args || 'None'}` },
        'CONTROL': { label: 'Modifier', icon: 'command', desc: (args) => `Hold CTRL + ${args || 'None'}` },
        'CTRL': { label: 'Modifier', icon: 'command', desc: (args) => `Hold CTRL + ${args || 'None'}` },
        'ALT': { label: 'Modifier', icon: 'option', desc: (args) => `Hold ALT + ${args || 'None'}` },
        'REPEAT': { label: 'Loop', icon: 'repeat', desc: (args) => `Repeat previous action ${args} times` },
        'DEFAULTDELAY': { label: 'Config', icon: 'settings-2', desc: (args) => `Set global command interval to ${args}ms` },
        'DEFAULT_DELAY': { label: 'Config', icon: 'settings-2', desc: (args) => `Set global command interval to ${args}ms` }
    },

    parse(script) {
        const lines = script.split('\n');
        const documentation = [];
        let lastCommand = null;

        lines.forEach((line, index) => {
            line = line.trim();
            if (!line) return;

            const part = line.match(/^(\S+)\s*(.*)$/);
            if (!part) return;

            const cmd = part[1].toUpperCase();
            const args = part[2];

            const mapping = this.commands[cmd];
            
            if (mapping) {
                const step = {
                    id: index,
                    command: cmd,
                    label: mapping.label,
                    icon: mapping.icon,
                    description: mapping.desc(args),
                    raw: line
                };
                documentation.push(step);
                lastCommand = step;
            } else if (cmd.length === 1 || this.isSpecialKey(cmd)) {
                // Handle single keys or special keys without a command prefix (e.g., F1, ENTER alone)
                documentation.push({
                    id: index,
                    command: 'KEY',
                    label: 'Keystroke',
                    icon: 'keyboard',
                    description: `Press ${cmd} key`,
                    raw: line
                });
            }
        });

        return documentation;
    },

    isSpecialKey(key) {
        const special = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','UP','DOWN','LEFT','RIGHT','UPARROW','DOWNARROW','LEFTARROW','RIGHTARROW','PAGEUP','PAGEDOWN'];
        return special.includes(key.toUpperCase());
    }
};
