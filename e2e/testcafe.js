import { Selector } from 'testcafe';
 
fixture('Wikipedia Random Page Test').page('https://en.wikipedia.org/wiki/Special:Random');
 
test('Follow first Wikipedia links until Philosophy or loop', async (t) => {
 const visitedTitles = new Set();
  let steps = 0;
  const maxSteps = 100; // Increased to allow longer paths

  while (steps < maxSteps) {
    const title = await getTitleText(t);
    console.log(`Step ${steps + 1}: Visiting "${title}"`);

    if (title === 'Philosophy') {
      console.log('🎉 Reached Philosophy!');
      break;
    }

    if (visitedTitles.has(title)) {
      console.log('🔄 Loop detected! Stopping to avoid infinite loop.');
      break;
    }

    visitedTitles.add(title);

    try {
      const link = await getFirstValidLink(t);
      await t.click(link);
    } catch (error) {
      console.log('❌ No valid link found or error occurred:', error.message);
      break;
    }

    steps++;

    // Add a small delay to be respectful to Wikipedia
    await t.wait(1000);
  }

  if (steps >= maxSteps) {
    console.log('⚠️ Max steps reached without finding Philosophy or detecting a loop.');
  }

  console.log(`Total steps taken: ${steps}`);
  console.log('Visited titles:', Array.from(visitedTitles));
});
 
const getTitleText = async (t) => {
  const title = Selector('#firstHeading');
  await t.expect(title.exists).ok({ timeout: 10000 });
  return await title.innerText;
};
 
const getFirstValidLink = async (t) => {
  const content = Selector('#mw-content-text');
  await t.expect(content.exists).ok({ timeout: 10000 });
 
  const firstValidLink = await content
    .find('p a')
    .filter((node) => {
      return (
        !node.closest('i') &&
        !node.closest('sup') &&
        !node.closest('.infobox') &&
        node.getAttribute('href')?.startsWith('/wiki/')
      );
    })
    .nth(0);
  await t.expect(firstValidLink.exists).ok({ timeout: 10000 });
  return firstValidLink;
};