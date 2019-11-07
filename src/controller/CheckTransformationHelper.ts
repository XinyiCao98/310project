import CheckQueryHelper from "./CheckQueryHelper";
import Log from "../Util";

export default class CheckTransformationHelper {
    private OperationNames: string[] = ["MAX", "MIN", "AVG", "SUM", "COUNT"];
    private NumericOperations: string[] = ["MAX", "MIN", "AVG", "SUM"];

    private CNProperties: string[] = ["avg", "pass", "fail", "audit", "year"];
    private RNProperties: string[] = ["lat", "lon", "seats"];

    private CProperties: string[] = ["avg", "pass", "fail", "audit", "year",
        "dept", "id", "instructor", "title", "uuid"];

    private RProperties: string[] = ["lat", "lon", "seats", "fullname", "shortname",
        "number", "name", "address", "type", "furniture", "href"];

    private CP: string[] = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];

    constructor() {
        //
    }

    public checkTrans(trans: any, options: any, Type: boolean, query: any): boolean {
        if (!trans.hasOwnProperty("APPLY") || !trans.hasOwnProperty("GROUP")) {
            return false;
        }
        let apply = trans["APPLY"];
        if (!this.checkApply(apply, Type)) {
            return false;
        }
        if (!this.checkElement(trans, options)) {
            return false;
        }
        let group = trans["GROUP"];
        let DatasetName = this.getDataName(query);
        Log.trace(DatasetName);
        if (!this.CheckDataSet(apply, group, DatasetName)) {
            return false;
        }
        this.getNew(apply);
        return true;
    }

    public checkElement(trans: any, options: any): boolean {
        let Col = options["COLUMNS"];
        if (!options.hasOwnProperty("COLUMNS") || !Array.isArray(Col)) {
            return false;
        }
        let Group = trans["GROUP"];
        if (!Array.isArray(Group) || Object.keys(Group).length < 1) {
            return false;
        }
        if (this.ObtainKeys(trans) === false) {
            return false;
        }
        let EleInTrans = this.ObtainKeys(trans);
        let p = Object.keys(Col).length;
        for (let l: number = 0; l < p; l++) {
            if (!EleInTrans.includes(Col[l])) {
                return false;
            }
        }
        return true;
    }

    // get all keys inside transformation
    public ObtainKeys(trans: any): any {
        let EleInT: string[] = [];
        let G = trans["GROUP"];
        let A = trans["APPLY"];
        let m = Object.keys(G).length;
        let n = Object.keys(A).length;
        for (let i: number = 0; i < m; i++) {
            if (typeof G[i] === "string") { // && this.RProperties.includes(G[i].split("_")[1])
                EleInT.push(G[i]);
            } else {
                return false;
            }
        }
        for (let k: number = 0; k < n; k++) {
            EleInT.push(Object.keys(A[k])[0]);
        }
        return EleInT;
    }

    // Check Elements inside Apply
    public checkApply(apply: any, Type: boolean): boolean {
        if (!Array.isArray(apply)) {
            return false;
        }
        // let DuplicateChecker: string[] = [];
        let newE: string = null;
        let standardP = this.CProperties;
        let standardNP = this.CNProperties;
        let flag = "courses";
        if (Type === true) {
            standardP = this.RProperties;
            standardNP = this.RNProperties;
            flag = "rooms";
        }
        let DuplicateChecker: string[] = [];
        for (let element of apply) {
            let key = Object.keys(element);
            let realkey = key[0];
            if (realkey.length === 0) {
                return false;
            }
            if (realkey.includes("_")) {
                return false;
            }
            if (!this.checkApplyInside(element, standardP, standardNP, flag)) {
                return false;
            }
            if (Object.keys(key).length !== 1) {
                return false;
            }
            if (typeof (realkey) !== "string") {
                return false;
            }
            newE = Object.values(key)[0];
            if (!this.CheckDuplicate(DuplicateChecker, newE)) {
                return false;
            }
        }
        return true;
    }

    // Take the names of the new elements created in APPLY
    public getNew(apply: any): string[] {
        let New: string[] = [];
        let values = Object.values(apply);
        for (let newP of values) {
            New.push(Object.keys(newP)[0]);
        }
        return New;
    }

    public CheckDuplicate(Viewed: string[], New: string): boolean {
        if (Viewed.indexOf(New) < 0) {
            Viewed.push(New);
            return true;
        } else {
            return false;
        }
    }

    public checkApplyInside(element: object, standardP: string[], standardNP: string[], flag: string): boolean {
        let value = Object.values(element)[0];
        let Operation = Object.keys(value)[0];
        let values = Object.values(element);
        let allValues = values[0];
        if (Object.keys(allValues).length !== 1) {
            return false;
        }
        if (this.OperationNames.indexOf(Operation) < 0) {
            return false;
        }
        let OperationObject = Object.values(value)[0];
        if (typeof OperationObject !== "string") { // TODO:
            return false;
        }
        let prefix = OperationObject.split("_")[0];
        if (prefix !== flag) {
            return false;
        }
        let property = OperationObject.split("_")[1];
        if (standardP.indexOf(property) < 0) {
            return false;
        }
        if (this.NumericOperations.indexOf(Operation) >= 0) {
            if (standardNP.indexOf(property) < 0) {
                return false;
            }
        }
        return true;
    }

    // Given an query find  the name of dataset based on the filtered elements
    public getDataName(query: any): string {
        const CheckQH = new CheckQueryHelper();
        let filteredEs = CheckQH.ElementInColFiltered(query);
        let Element = filteredEs[0];
        if (filteredEs.length === 0) {
            return this.GetIDSPECIALCASE(query);
        } else {
            let dataName = Element.split("_")[0];
            return dataName;
        }
    }

    public CheckDataSet(apply: any, group: any, DataSetName: string): boolean {
        let Operation: { [key: string]: string };
        for (let property of group) {
            Log.trace([property]);
            let dataN = property.split("_")[0];
            let value = property.split("_")[1];
            if (dataN !== DataSetName) {
                return false;
            }
            if (!this.CProperties.includes(value) && !this.RProperties.includes(value)) {
                return false;
            }
        }
        let ElementsInApply = Object.values(apply);
        for (let element of ElementsInApply) {
            Operation = Object.values(element)[0];
            let p = Object.values(Operation)[0];
            let DSN = p.split("_")[0];
            if (DSN !== DataSetName) {
                return false;
            }
        }
        return true;
    }

    public GetIDSPECIALCASE(query: any): string {
        let group = query["TRANSFORMATIONS"]["GROUP"];
        let pro = group[0];
        // Log.trace(DSName);
        return pro.split("_")[0];
    }

    public GetPropertySPECIALCASE(query: any): string {
        let group: string[] = [];
        group = query["TRANSFORMATIONS"]["GROUP"];
        let pro = group[0];
        let Property = pro.split("_")[1];
        return Property;
    }

    public FindDeterminType(filtered: string[], querey: any): string {
        let DP: string;
        if (filtered.length === 0) {
            DP = this.GetPropertySPECIALCASE(querey);
        } else {
            DP = filtered[0].split("_")[1];
        }
        return DP;
    }

    public findUniqueP(query: any): string {
        let ID = null;
        const CQH = new CheckQueryHelper();
        let filteredn = CQH.ElementInColFiltered(query);
        let DeterminProperty = this.FindDeterminType(filteredn, query);
        if (this.CP.indexOf(DeterminProperty) < 0) {
            ID = "_name";
        } else {
            ID = "_uuid";
        }
        return ID;
    }

}
