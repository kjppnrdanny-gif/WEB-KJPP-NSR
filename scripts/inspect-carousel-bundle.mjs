import fs from 'node:fs';

const bundle = fs.readFileSync('lib/flex-carousel.bundle.js', 'utf8');
console.log('flex-carousel.bundle.js length:', bundle.length);
console.log('window exports in bundle:', bundle.match(/window\.\w+/g)?.slice(0, 10));
console.log('FlexCarouselModule in bundle:', bundle.includes('FlexCarouselModule'));
console.log('initFlexCarousel in bundle:', bundle.includes('initFlexCarousel'));

if (fs.existsSync('lib/flex-carousel-vanilla.js')) {
  const vanilla = fs.readFileSync('lib/flex-carousel-vanilla.js', 'utf8');
  console.log('flex-carousel-vanilla.js length:', vanilla.length);
  console.log('initFlexCarousel in vanilla:', vanilla.includes('initFlexCarousel'));
}
