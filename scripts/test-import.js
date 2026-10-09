import { pipeline } from '@huggingface/transformers';

console.log('Testing @huggingface/transformers import...');
try {
  console.log('Pipeline loaded successfully from module.');
} catch (err) {
  console.error('Error importing:', err);
}
