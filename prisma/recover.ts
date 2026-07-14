import * as fs from 'fs';
import * as path from 'path';

const convs = [
  '611a5609-3910-4d0a-96f2-d1fd71ecf295',
  'ba526e32-feb1-4999-bec1-5d16a9b0d303',
  '08f92465-eff6-4765-8c5e-129e9cb274bf'
];

interface ToolCall {
  name: string;
  args: any;
}

interface Step {
  convId: string;
  stepIndex: number;
  toolCalls: ToolCall[];
}

function loadSteps(): Step[] {
  const steps: Step[] = [];
  for (const convId of convs) {
    const logPath = `C:\\Users\\pc\\.gemini\\antigravity\\brain\\${convId}\\.system_generated\\logs\\transcript_full.jsonl`;
    if (!fs.existsSync(logPath)) continue;
    const fileContent = fs.readFileSync(logPath, 'utf8');
    const lines = fileContent.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          const tcList = obj.tool_calls.filter((tc: any) => 
            tc.args && tc.args.TargetFile && tc.args.TargetFile.endsWith('admin-portal.html.ts')
          );
          if (tcList.length > 0) {
            steps.push({
              convId,
              stepIndex: obj.step_index,
              toolCalls: tcList
            });
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return steps;
}

function applyReplace(content: string, target: string, replacement: string): string {
  const index = content.indexOf(target);
  if (index === -1) {
    throw new Error(`TargetContent not found in file content! Target was:\n${target.slice(0, 100)}...`);
  }
  // Check if multiple occurrences
  const secondIndex = content.indexOf(target, index + target.length);
  if (secondIndex !== -1) {
    console.warn(`WARNING: Multiple occurrences found for target: \n${target.slice(0, 100)}...`);
  }
  return content.slice(0, index) + replacement + content.slice(index + target.length);
}

async function main() {
  const steps = loadSteps();
  console.log(`Loaded ${steps.length} steps that modified admin-portal.html.ts`);

  let content = '';

  for (const step of steps) {
    // Skip our bad edits in the current conversation (steps 954, 958)
    if (step.convId === '08f92465-eff6-4765-8c5e-129e9cb274bf' && step.stepIndex >= 954) {
      console.log(`Skipping bad edit at step ${step.stepIndex} in current conversation`);
      continue;
    }

    console.log(`Applying step ${step.stepIndex} from conversation ${step.convId}`);
    for (const tc of step.toolCalls) {
      if (tc.name === 'write_to_file') {
        content = tc.args.CodeContent;
        console.log(`  Initialized file via write_to_file (size: ${content.length} chars)`);
      } else if (tc.name === 'replace_file_content') {
        const target = tc.args.TargetContent;
        const replacement = tc.args.ReplacementContent;
        try {
          content = applyReplace(content, target, replacement);
          console.log(`  Applied replace_file_content (new size: ${content.length} chars)`);
        } catch (err: any) {
          console.error(`  Error in replace_file_content: ${err.message}`);
        }
      } else if (tc.name === 'multi_replace_file_content') {
        const chunks = tc.args.ReplacementChunks || [];
        console.log(`  Applying multi_replace_file_content with ${chunks.length} chunks`);
        // Sort chunks by startLine desc or apply sequentially if they match unique substrings
        for (const chunk of chunks) {
          const target = chunk.TargetContent;
          const replacement = chunk.ReplacementContent;
          try {
            content = applyReplace(content, target, replacement);
            console.log(`    Applied chunk (new size: ${content.length} chars)`);
          } catch (err: any) {
            console.error(`    Error in chunk: ${err.message}`);
          }
        }
      }
    }
  }

  if (content) {
    fs.writeFileSync('apps/core-hub/src/modules/admin/admin-portal.html.ts', content, 'utf-8');
    console.log('Successfully reconstructed and wrote admin-portal.html.ts!');
  } else {
    console.log('Failed to reconstruct file content.');
  }
}

main().catch(console.error);
