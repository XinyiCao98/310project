import * as fs from "fs";
export default class Datasets {
    public Databse: Map<string, any>;
    constructor() {
        this.Databse = new Map<string, any[]>();
    }
    public getDatasets (DataId: string): any {
        if (! fs.existsSync("./data/" + DataId + ".json")) {
            return null;
        }
        if ( this.Databse.get(DataId) === [] || this.Databse.get(DataId) === undefined) {
            let Data = fs.readFileSync("./data/" + DataId + ".json", "utf8");
            this.Databse.set (DataId, JSON.parse(Data) );
        }
        return this.Databse.get(DataId);
    }
    public getData (DataId: string): any {
        return this.Databse.get(DataId);
    }
}
