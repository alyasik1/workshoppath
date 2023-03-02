var argv = require("minimist")(process.argv.slice(2));
const Opensea = require("./opensea");
var fs = require("fs");


(async () => {
    const collection = argv["collection"].toLowerCase().replace("https://opensea.io/collection/", "");
    const opensea = new Opensea(collection);

    let items = [];
    for (let bool of ["true", "false"]) {
        while (true) {
            try {
                await opensea.create();
                await opensea.getRequestHeader(bool);
                let result = await opensea.getItems();
                if (items.length > 0) result = result.reverse();
                items = items.concat(result);
                await opensea.browser.close();
                break;
            } catch {
                try {
                    await opensea.browser.close();
                    new Promise(resolve => setTimeout(resolve, 5000));
                } catch {}
            }
        }
    }

    argv["save"] ? console.log(JSON.stringify(items)) : fs.writeFileSync(
        `data/${collection}.json`, JSON.stringify(items, null, 4));
})();