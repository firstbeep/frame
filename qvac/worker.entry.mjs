// Load only the native addon this application uses. The default SDK worker
// imports every addon, making unrelated native dependencies startup blockers.
import { initializeWorker, ensureRPCSetup } from '@qvac/sdk/worker-lifecycle';
import { registerPlugins } from '@qvac/inference/plugins';
import { diffusionPlugin } from '@qvac/sdk/sdcpp-generation/plugin';
const { hasRPCConfig } = initializeWorker();
registerPlugins([diffusionPlugin]);
if (hasRPCConfig) ensureRPCSetup();
