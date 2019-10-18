import Log from "../Util";

export class CheckTransformationHelper {

    constructor() {
        //
    }

   public checkTrans (trans: any, options: any): boolean {
        if (Object.keys(trans).length !== 2 ||
            !trans.hasOwnProperty("APPLY") ||
            !trans.hasOwnProperty("GROUP")) {
            return false;
}
        if (!this.checkElement(trans, options)) {
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
       let Apply = trans["APPLY"];  // should add a format check for Transformation
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
}
