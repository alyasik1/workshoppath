const puppeteer = require("puppeteer");
const UserAgent = require("user-agents");
const {
    catchCollectionItemsRequestHeader,
    sendImitiatedQuery,
    setRequestInterceptionTrue
} = require("./utils.js");


class Browser {

    constructor(collection) {
        this.collection = collection;
        this.number_items = 0;
        this.page;
        this.headers;
    }

    async create() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                "--start-maximized",
                "--hide-scrollbars",
                "--incognito"
            ],
            defaultViewport: null
        });

        const [page] = await this.browser.pages();
        this.page = page;
        this.page.setUserAgent(new UserAgent().toString());

        setRequestInterceptionTrue(this.page);
    }

    async getRequestHeader(bool) {
        await this.page.goto(`https://opensea.io/collection/${this.collection}?search[sortBy]=CREATED_DATE&search[sortAscending]=${bool}`);

        this.headers = await catchCollectionItemsRequestHeader(this.page, () => {
            this.page.evaluate(() => {
                const height = document.body.scrollHeight;
                let range = (start, end) => Array.from(Array(end + 1).keys()).slice(start);
                const array = [...range(1, 10), ...[...range(5, 10)].reverse()];
                array.forEach((scroll, index) => {
                    setTimeout(() => window.scroll({
                        top: height * scroll * .1,
                        behavior: 'smooth'
                    }), 100 * index);
                });
            });
        });
        if (this.headers === null) await this.getRequestHeader(bool);
    }

    async getItems() {
        let count = 20;
        let offset = 0;
        let disabled = false;

        return new Promise(async resolve => {
            let total_items = [];
            while (true) {
                try {
                    const items = await sendImitiatedQuery(this.page, this.headers, this.collection, count, offset);
                    if (items.length === 0) {
                        this.page.off("response");
                        resolve(total_items);
                        break;
                    } else {
                        total_items = total_items.concat(items);
                        this.number_items += count;
                        console.log(this.number_items);
                        offset += count;
                    }
                } catch {}
            }
        });
    }
}


module.exports = Browser;