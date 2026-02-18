import { getOpenAI } from './openai-client.mjs';
import { createLogger } from './logger.mjs';

const log = createLogger('image-generator');

/**
 * Generate a square 1:1 image using OpenAI's gpt-image-1 model.
 * Size is always 1024x1024 — the feed UI renders in a square container.
 * Returns { b64_json, url, revisedPrompt } or null on failure.
 */
export async function generateImage({ prompt, size = '1024x1024', quality = 'medium' } = {}) {
  const openai = getOpenAI();

  // Force square and prepend aspect ratio instruction to every prompt
  const squareSize = '1024x1024';
  const squarePrompt = `[IMPORTANT: Output must be a perfect square image, 1:1 aspect ratio. No letterboxing, no borders, fill the entire square canvas.]\n\n${prompt}`;

  log.info('Generating square image', { promptPreview: prompt.slice(0, 80), size: squareSize });

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: squarePrompt,
    n: 1,
    size: squareSize,
    quality,
  });

  const image = response.data[0];
  log.info('Image generated successfully');
  return {
    b64_json: image.b64_json || null,
    url: image.url || null,
    revisedPrompt: image.revised_prompt || prompt,
  };
}

/**
 * Generate a full carousel of images (7-9 images) for a post.
 * All slides generate concurrently via Promise.all for max throughput.
 *
 * @param {Object} params
 * @param {string} params.question - The main question for slide 1
 * @param {string[]} params.imagePrompts - Array of prompts for slides 2+
 * @param {string} params.style - Visual style hint (e.g. "bold graphic", "meme", "infographic")
 * @returns {Promise<Array<{slideNumber, prompt, imageData}>>}
 */
export async function generateCarousel({ question, imagePrompts, style = 'modern bold graphic' }) {
  // Slide 1: The question as a bold graphic
  const slide1Prompt = `Create a bold, eye-catching square social media graphic (1:1 aspect ratio, fill entire canvas) with the following question displayed prominently in large stylized text. The design should be ${style} with a dark background and vibrant accent colors. No small text, no borders, no letterboxing. The question is: "${question}"`;

  // Build all slide tasks
  const slideTasks = [
    {
      slideNumber: 1,
      type: 'question',
      prompt: slide1Prompt,
      quality: 'high',
    },
    ...imagePrompts.map((prompt, i) => ({
      slideNumber: i + 2,
      type: 'supporting',
      prompt,
      quality: 'medium',
    })),
  ];

  log.info(`Generating ${slideTasks.length} slides concurrently...`);

  // Fire all image requests in parallel
  const results = await Promise.all(
    slideTasks.map(async (task) => {
      try {
        const img = await generateImage({ prompt: task.prompt, quality: task.quality });
        return { slideNumber: task.slideNumber, type: task.type, prompt: task.prompt, imageData: img };
      } catch (err) {
        log.error(`Failed to generate slide ${task.slideNumber}`, { error: err.message });
        return { slideNumber: task.slideNumber, type: task.type, prompt: task.prompt, imageData: null, error: err.message };
      }
    })
  );

  // Sort by slide number
  results.sort((a, b) => a.slideNumber - b.slideNumber);

  log.info(`Carousel generated: ${results.filter(r => r.imageData).length}/${results.length} slides successful`);
  return results;
}
