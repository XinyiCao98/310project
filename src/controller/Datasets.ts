import * as fs from "fs";
import {InsightError} from "./IInsightFacade";
import Log from "../Util";

export default class Datasets {
    public Datasets: Map<string, object[]>;

    constructor(DataMap: Map<string, object[]>) {
        this.Datasets = DataMap;
    }

    public getDatasets(DataId: string): any {
        if (!fs.existsSync("./data/" + DataId + ".json")) {
            return null;
        }
        if (this.Datasets.get(DataId) === [] || this.Datasets.get(DataId) === undefined || !this.Datasets.has(DataId)) {
            // dataset not exists in map
            const Data = fs.readFileSync("./data/" + DataId + ".json", "utf8");
            try {
                this.Datasets = new Map<string, object[]>();
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
