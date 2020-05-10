#!/bin/sh
echo "let emojify = (src) => {
  let emojis=$(curl -s 'https://gist.githubusercontent.com/oliveratgithub/0bf11a9aff0d6da7b46f1490f86a71eb/raw/ac8dde8a374066bcbcf44a8296fc0522c7392244/emojis.json' | jq -Mc '[.emojis | .[] | {code: .html, name: .name, }]');
  let m;
  while ((m = /:([a-zA-Z0-9-_]+):/g.exec(src)) !== null) {
    let r = emojis.find(o => o.name === m[1]);
    src = src.replace(m[0], (r !== undefined ? r.code : \`&#58\${m[1]}&#58\`));
  }
  return src;
};" > public/emoji.js