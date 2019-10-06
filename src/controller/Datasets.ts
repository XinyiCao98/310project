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
        if (this.Datasets.get(DataId) === [] || this.Datasets.get(DataId) === undefined) {
            // fs.readFile
            const Data = fs.readFileSync("./data/" + DataId + ".json", "utf8");
            this.Datasets.set(DataId, JSON.parse(Data));
        }
        return this.Datasets;
    }

    public getData(DataId: string): any {
        return JSON.parse(JSON.stringify(this.Datasets.get(DataId)));
    }
}
