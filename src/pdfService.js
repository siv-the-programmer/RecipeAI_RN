import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function generateAndSharePDF(recipe) {
  const ingredientRows = (recipe.ingredients || [])
    .map(i => `<li><span class="amt">${i.amount} ${i.unit}</span> ${i.item}</li>`)
    .join('');

  const stepRows = (recipe.steps || [])
    .map(s => `
      <div class="step">
        <div class="step-num">${s.number}</div>
        <div class="step-text">${s.instruction}</div>
      </div>`)
    .join('');

  const tipRows = (recipe.tips || [])
    .map(t => `<li>${t}</li>`)
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Georgia,serif;background:#FAFAF8;color:#2C2C2C}
  .header{background:linear-gradient(135deg,#1A1A2E,#0F3460);color:white;padding:48px 40px 56px}
  .emoji{font-size:60px;display:block;margin-bottom:14px}
  .title{font-size:32px;font-weight:700;margin-bottom:8px}
  .desc{font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6}
  .meta{display:flex;background:white;margin:24px 40px;border-radius:14px;box-shadow:0 2px 16px rgba(0,0,0,0.08);overflow:hidden}
  .meta-item{flex:1;padding:18px;text-align:center;border-right:1px solid #F0F0F0}
  .meta-item:last-child{border-right:none}
  .meta-label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:4px}
  .meta-value{font-size:15px;font-weight:700;color:#1A1A2E}
  .section{padding:20px 40px}
  .section-title{font-size:20px;font-weight:700;color:#1A1A2E;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #E8E8E8}
  .ing-list{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .ing-list li{background:white;padding:10px 14px;border-radius:8px;font-size:13px;border-left:3px solid #0F3460;box-shadow:0 1px 4px rgba(0,0,0,0.05)}
  .amt{font-weight:700;color:#0F3460;margin-right:4px}
  .step{display:flex;gap:14px;margin-bottom:16px;align-items:flex-start}
  .step-num{width:32px;height:32px;background:linear-gradient(135deg,#E94560,#C2185B);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;margin-top:2px}
  .step-text{font-size:13px;line-height:1.7;color:#3C3C3C;background:white;padding:12px 16px;border-radius:10px;flex:1;box-shadow:0 1px 4px rgba(0,0,0,0.05)}
  .tips-box{background:#FFF8E7;margin:0 40px 20px;border-radius:14px;padding:20px;border-left:4px solid #F4A400}
  .tips-title{font-size:13px;font-weight:700;color:#B87800;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
  .tips-list{list-style:none}
  .tips-list li{font-size:12px;color:#5C4A00;line-height:1.6;padding:3px 0 3px 14px;position:relative}
  .tips-list li::before{content:"★";position:absolute;left:0;color:#F4A400}
  .nut-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .nut-card{background:white;padding:14px 10px;border-radius:10px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05)}
  .nut-val{font-size:20px;font-weight:700;color:#1A1A2E;display:block}
  .nut-lbl{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-top:2px}
  .footer{text-align:center;padding:20px 40px 36px;color:#CCC;font-size:10px}
</style></head><body>

<div class="header">
  <span class="emoji">${recipe.emoji || ''}</span>
  <div class="title">${recipe.title}</div>
  <div class="desc">${recipe.description || ''}</div>
</div>

<div class="meta">
  <div class="meta-item"><div class="meta-label">Prep</div><div class="meta-value">${recipe.prepTime || '—'}</div></div>
  <div class="meta-item"><div class="meta-label">Cook</div><div class="meta-value">${recipe.cookTime || '—'}</div></div>
  <div class="meta-item"><div class="meta-label">Serves</div><div class="meta-value">${recipe.servings || 2}</div></div>
  <div class="meta-item"><div class="meta-label">Level</div><div class="meta-value">${recipe.difficulty || 'Medium'}</div></div>
</div>

<div class="section">
  <div class="section-title"> Ingredients</div>
  <ul class="ing-list">${ingredientRows}</ul>
</div>

<div class="section">
  <div class="section-title"> Instructions</div>
  ${stepRows}
</div>

${tipRows ? `<div class="tips-box"><div class="tips-title"> Chef's Tips</div><ul class="tips-list">${tipRows}</ul></div>` : ''}

${recipe.nutrition ? `
<div class="section">
  <div class="section-title"> Nutrition per serving</div>
  <div class="nut-grid">
    <div class="nut-card"><span class="nut-val">${recipe.nutrition.calories}</span><span class="nut-lbl">Calories</span></div>
    <div class="nut-card"><span class="nut-val">${recipe.nutrition.protein}</span><span class="nut-lbl">Protein</span></div>
    <div class="nut-card"><span class="nut-val">${recipe.nutrition.carbs}</span><span class="nut-lbl">Carbs</span></div>
    <div class="nut-card"><span class="nut-val">${recipe.nutrition.fat}</span><span class="nut-lbl">Fat</span></div>
  </div>
</div>` : ''}

<div class="footer">Generated by Recipe AI · Powered by Groq + Llama</div>
</body></html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${recipe.title} Recipe`,
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}
