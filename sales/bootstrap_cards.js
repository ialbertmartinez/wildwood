const fs = require("fs");
const cheerio = require("cheerio");

function convertToBootstrapCards(inputFile, outputFile) {
  const html = fs.readFileSync(inputFile, "utf-8");
  const $ = cheerio.load(html, { decodeEntities: false });
  let count = 0;

  $(".horse-card").each((i, el) => {
    const $card = $(el);
    const $info = $card.find(".card-info");

    // 1. Extract Image
    const imgSrc = $card.find("img").attr("src") || "";

    // 2. Extract & Clean Name
    // Grab the name, but clean up those weird `class="lineage"` artifacts from the old script
    let nameText =
      $info.find("h3").text() || $info.find("strong").first().text() || "";
    nameText = nameText
      .replace(/class="lineage"/g, "")
      .replace(/[\n\r]+/g, " ")
      .trim();

    // 3. Extract Lineage / Stats
    // Find the first paragraph that actually contains text (and isn't just a link)
    let $lineagePara = $info.find(".lineage, .card-text").first();
    if ($lineagePara.length === 0) {
      $info.find("p").each((idx, p) => {
        if (
          $(p).text().trim().length > 5 &&
          $(p).find("a").length === 0 &&
          $lineagePara.length === 0
        ) {
          $lineagePara = $(p);
        }
      });
    }
    let lineageHtml = $lineagePara.html() || "";

    // 4. Extract Story
    let storyHtmlArray = [];
    $info.find("p").each((idx, p) => {
      const pText = $(p).text().trim();
      const pHtml = $(p).html().trim();

      // Skip the lineage paragraph, empty paragraphs, and paragraphs containing links
      if (
        $(p).is($lineagePara) ||
        pText === "" ||
        pHtml === "&nbsp;" ||
        $(p).find("a").length > 0
      ) {
        return;
      }

      // Clean up stray <br> tags at the beginning or end of paragraphs
      let cleanedHtml = pHtml
        .replace(/^(<br\s*\/?>\s*)+|(<br\s*\/?>\s*)+$/gi, "")
        .trim();
      if (cleanedHtml) {
        storyHtmlArray.push(cleanedHtml);
      }
    });
    // Join the paragraphs together with Bootstrap's preferred spacing
    const finalStoryHtml = storyHtmlArray.join("<br /><br />\n");

    // 5. Extract Links
    let pedigreeLink = "#";
    let photosLink = "#";
    let videoLink = "#";

    $info.find("a").each((idx, a) => {
      const aText = $(a).text().toLowerCase();
      const aHref = $(a).attr("href") || "#";

      if (aText.includes("pedigree")) pedigreeLink = aHref;
      if (aText.includes("photo")) photosLink = aHref;
      if (aText.includes("video")) videoLink = aHref;
    });

    // --- BUILD NEW BOOTSTRAP CARD ---
    const newCardHtml = `
<div class="card mb-4" style="max-width: 800px; margin: 0 auto;">
    <div class="row g-0">
        <div class="col-md-6">
            <img src="${imgSrc}" class="img-fluid rounded-start" alt="${nameText}" style="height: 100%; object-fit: cover;">
        </div>

        <div class="col-md-6">
            <div class="card-header bg-white border-0 pt-4">
                <h3 class="card-title">${nameText}</h3>
                <p class="card-subtitle mb-2 text-body-secondary">${lineageHtml}</p>
            </div>

            <div class="card-body">
                <p class="card-text">
                    <small class="text-body-secondary">
                        ${finalStoryHtml}
                    </small>
                </p>
            </div>
            
            <div class="card-footer bg-white border-0 pb-4">
                ${pedigreeLink !== "#" ? `<a class="card-link mx-2" href="${pedigreeLink}" target="_blank">Pedigree</a> |` : ""}
                ${photosLink !== "#" ? `<a class="card-link mx-2" href="${photosLink}">Photos</a> |` : ""}
                ${videoLink !== "#" ? `<a class="card-link mx-2" href="${videoLink}" target="_blank">Videos</a>` : ""}
            </div>
        </div>
    </div>
</div>`;

    // Replace the old layout with the new Bootstrap layout
    $card.replaceWith(newCardHtml);
    count++;
  });

  // Save it to a brand new file
  fs.writeFileSync(outputFile, $.html(), "utf-8");
  console.log(`\nBoom! Converted ${count} horses to Bootstrap cards.`);
  console.log(`Saved output to: ${outputFile}\n`);
}

// Ensure these file names match your actual files!
const inputHtmlFile = "index.html";
const outputHtmlFile = "index_bootstrap.html";

convertToBootstrapCards(inputHtmlFile, outputHtmlFile);
