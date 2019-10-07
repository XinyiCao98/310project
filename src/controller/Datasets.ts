import * as fs from "fs";
import {InsightError} from "./IInsightFacade";

export default class Datasets {
    public Datasets: Map<string, object[]>;

    constructor() {
        this.Datasets = new Map<string, object[]>();
    }

    public getDatasets(DataId: string): any {
        if (!fs.existsSync("./data/" + DataId + ".json")) {
            return null;
        }
        if (this.Datasets.get(DataId) === [] || this.Datasets.get(DataId) === undefined || !this.Datasets.has(DataId)) {
            // fs.readFile
            const Data = fs.readFileSync("./data/" + DataId + ".json", "utf8");
            try {
                this.Datasets.set(DataId, JSON.parse(Data));
            } catch (err) {
                this.Datasets = new Map<string, object[]>();
            }
        }
        return this.Datasets;
    }

    public getData(DataId: string): any {
        return this.Datasets.get(DataId);
    }
}
