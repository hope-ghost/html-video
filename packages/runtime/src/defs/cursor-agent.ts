import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AgentDef } from '../types.js';

const LOCAL_BIN = join(homedir(), '.local', 'bin');

export const cursorAgent: AgentDef = {
  id: 'cursor-agent',
  name: 'Cursor Agent',
  // Official Cursor CLI binary (2026 docs). Legacy name: cursor-agent.
  bin: 'agent',
  altBins: ['cursor-agent'],
  binFallbacks: [
    join(LOCAL_BIN, 'agent.exe'),
    join(LOCAL_BIN, 'agent.cmd'),
    join(LOCAL_BIN, 'cursor-agent.exe'),
    join(LOCAL_BIN, 'cursor-agent.cmd'),
    join(LOCAL_BIN, 'agent'),
    join(LOCAL_BIN, 'cursor-agent'),
  ],
  versionArgs: ['--version'],
  buildArgs(_prompt, _ctx) {
    return ['--print'];
  },
  streamFormat: 'plain',
  promptViaStdin: true,
  installUrl: 'https://cursor.com/cli',
  unavailableHint:
    '需单独安装 Cursor CLI（终端命令 agent），与 Cursor 桌面版是两套东西。Windows PowerShell: irm https://cursor.com/install?win32=true | iex，然后重启 Studio。',
};
