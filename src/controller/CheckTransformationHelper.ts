import Log from "../Util";
import {split} from "ts-node";

export class CheckTransformationHelper {
     private OperationNames: string[] = ["MAX", "MIN", "AVG" , "SUM", "COUNT"];
     private NumericOperations: string[] = ["MAX", "MIN", "AVG", "SUM"];
     private NumericProperties: string[] = ["pass", "fail", "audit", "year", "avg", "lat", "lon", "seats"];
     private Properties: string[] = ["fullname", "shortname", "number", "name", "address", "lat", "lon",
         "seats", "type", "furniture", "href", "dept", "id", "avg", "instructor", "title", "pass", "fail",
         "audit", "uuid", "year"];

    constructor() {
        //
    }

   public checkTrans(trans: any, options: any): boolean {
        if (Object.keys(trans).length !== 2 ||
            !trans.hasOwnProperty("APPLY") ||
            !trans.hasOwnProperty("GROUP")) {
            return false;
}
        if (!this.checkElement(trans, options)) {
        return false;
}
        let apply = trans["APPLY"];
        if (!this.checkApply(apply)) {
            return false;
        }
        return true;
}

   public checkElement(trans: any, options: any): boolean {
       let Col = options["COLUMNS"];
       if (!options.hasOwnProperty("COLUMNS") || !Array.isArray(Col)) {
           return false;
}
       let Group = trans["GROUP"];
       if (typeof Group !== "string" &&
        ! Array.isArray(Group)) {
           return false;
       }
       let  EleInTrans = this.ObtainKeys(trans);
       let p = Object.keys(Col).length;
       for (let l: number = 0; l < p ; l++ ) {
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
            for (let i: number = 0; i < m ; i++ ) {
                EleInT.push(G[i]);
            }
        }
        for (let k: number = 0; k < n ; k++) {
         EleInT.push(Object.keys(A[k])[0]);
        }
        return EleInT;
    }

    // Check Elements inside Apply
    public checkApply(apply: any): boolean {
        if (!Array.isArray(apply)) {
            return false;
        }
        for (let element of apply) {
            let key = Object.keys(element);
            let realkey = key[0];
            if (typeof(realkey) !== "string") {
                return false;
             }
            let value  = Object.values(element)[0];
            let Operation = Object.keys(value)[0];
            if (this.OperationNames.indexOf(Operation) < 0) {
                return false;
            }
            let OperationObject = Object.values(value)[0];
            let property = OperationObject.split("_")[1];
            if (this.Properties.indexOf(property) < 0) {
                return false;
            }
            if (this.NumericOperations.indexOf(Operation) > 0) {
                if (this.NumericProperties.indexOf(property) < 0) {
                    return false;
                 }
            }
        }
        return true;
    }
}
