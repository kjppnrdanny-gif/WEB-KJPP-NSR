import fs from 'node:fs';

console.log('Checking lib files...');
if (fs.existsSync('lib')) {
  console.log('lib contents:', fs.readdirSync('lib'));
} else {
  console.log('lib directory does not exist!');
}
if (fs.existsSync('components/FlexCarousel.css')) {
  console.log('components/FlexCarousel.css exists');
} else {
  console.log('components/FlexCarousel.css MISSING!');
}
