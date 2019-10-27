import Log from "../Util";
import {split} from "ts-node";

export class CheckTransformationHelper {
    private OperationNames: string[] = ["MAX", "MIN", "AVG", "SUM", "COUNT"];
    private NumericOperations: string[] = ["MAX", "MIN", "AVG", "SUM"];

    private CNProperties: string[] = ["avg", "pass", "fail", "audit", "year"];
    private RNProperties: string[] = ["lat", "lon", "seats"];

    private CProperties: string[] = ["avg", "pass", "fail", "audit", "year",
        "dept", "id", "instructor", "title", "uuid"];

    private RProperties: string[] = ["lat", "lon", "seats", "fullname", "shortname",
        "number", "name", "address", "type", "furniture", "href"];

    constructor() {
        //
    }

    public checkTrans(trans: any, options: any, Type: boolean): boolean {
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
        this.getNew(apply);
        return true;
    }

    public checkElement(trans: any, options: any): boolean {
        let Col = options["COLUMNS"];
        if (!options.hasOwnProperty("COLUMNS") || !Array.isArray(Col)) {
            return false;
        }
        let Group = trans["GROUP"];
        if (!Array.isArray(Group)) {
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
    public ObtainKeys(trans: any): string[] {
        let EleInT: string[] = [];
        let G = trans["GROUP"];
        let A = trans["APPLY"];
        let m = Object.keys(G).length;
        let n = Object.keys(A).length;
        if (typeof G === "string") {
            EleInT.push(G);
        } else {
            for (let i: number = 0; i < m; i++) {
                EleInT.push(G[i]);
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
        if (Type === true) {
            standardP = this.RProperties;
            standardNP = this.RNProperties;
        }
        let DuplicateChecker: string[] = [];
        for (let element of apply) {
            let key = Object.keys(element);
            let realkey = key[0];
            if (realkey.includes("_")) {
                return false;
            }
            if (!this.checkApplyInside(element , standardP, standardNP)) {
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

    public CheckDuplicate(Viewed: string[], New: string):  boolean {
        if (Viewed.indexOf(New) < 0) {
            Viewed.push(New);
            return true;
        } else {
            return false;
        }
    }

    public checkApplyInside(element: object, standardP: string[], standardNP: string[]): boolean {
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
        if (typeof OperationObject !== "string") {
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
}
