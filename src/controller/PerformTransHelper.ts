import Log from "../Util";
import Decimal from "decimal.js";

export  default class PerformTransHelper {
    // public datasetArray: [];
    constructor() {
    //
    }

   public performTrans(Data: object[], Group: any, Apply: any): object[] {
        let output: object[] = Data;
        let group: string[];
        let apply: object[];
        group = Group;
        apply = Apply;
        let n = group.length;
        output = this.performGroup(Data, group);
        output = this.PerformApply(apply, output);
        return output;
   }

   public performGroup(Data: object[], Keys: string[]): object[] {
        let output: object[];
        let n = Keys.length;
        let initialKey = Keys[0];
        output = this.performFirstGroup(Data, initialKey);
        if (n === 1) {
            return output;
        } else {
            output = this.performRestKeys(output, Keys);
            return output;
        }
   }

   public performRestKeys(Data: object[], Keys: string[]): object[] {
        let m: number;
        let n = Keys.length;
        let currentKey: string;
        let output: object[] = [];
        let storage: object[];
        let DataInProcess: object[] = [];
        for (let i: number = 1; i < n; i++) {
            currentKey = Keys[i];
            m = Data.length;
            for (let j: number = 0; j <  m; j++) {
                 DataInProcess = Object.values(Data[j]);
                 storage = this.performFirstGroup(DataInProcess, currentKey);
                 output = this.loadElements(output, storage);
                 DataInProcess = [];
            }
            Data = output;
            output = [];
        }
        return Data;
}

public loadElements(output: any[], add: object[]) {
        let m = add.length;
        for (let i: number = 0 ; i < m ; i++ ) {
            output.push(add[0]);
            add.splice(0, 1);
        }
        return output;
}

   // Group an array of objects based on a given Key
    public performFirstGroup(Data: object[], Key: string ): object[] {
        let grouped: object[] = [];
        let o: {[key: string]: any};
        grouped = Data.reduce(function (r, a) {
            let key = Key;
            o = a;
            r[o[key]] = r[o[key]] || [];
            r[o[key]].push(o);
            return r;
        }, Object.create(null));
        let result = Object.values(grouped);
        return result;
   }


    // Perform the part inside APPLY clause
    public PerformApply(apply: object[] , Data: object[]): object[] {
        let afterApply: object [] = [];
        let NumOfGroups = Data.length;
        for (let i: number = 0; i < NumOfGroups; i++ ) {
           let Group = Data[i];
           let EZero = Object.values(Group)[0];
           afterApply.push(EZero);
       }
        let NumOfApply =  Object.keys(apply).length;
        for (let k: number = 0; k < NumOfApply; k++ ) {
            let Apply = Object.values(apply)[k];
            let ApplyKey = Object.keys(Apply)[0];
            let ApplyValue: {[key: string]: string};
            ApplyValue = Object.values(Apply)[0];
            let Operation = Object.keys(ApplyValue)[0];
            let AppliedP = Object.values(ApplyValue)[0];
            if (Operation === "MIN") {
               afterApply = this.PerformMin(afterApply, ApplyKey, AppliedP, Data);
            }
            if (Operation === "MAX") {
                afterApply = this.PerformMax(afterApply, ApplyKey, AppliedP, Data);
            }
            if (Operation === "COUNT") {
                afterApply = this.PerformCount(afterApply, ApplyKey, AppliedP, Data);
            }
            if (Operation === "SUM") {
                afterApply = this.CalculateSum(afterApply, ApplyKey, AppliedP, Data);
            }
            if (Operation === "AVG") {
                afterApply = this.CalculateAvg(afterApply, ApplyKey, AppliedP, Data);
            }

        }

        return afterApply;
    }

    public PerformMin(afterApply: object[], Name: string, Property: string, Data: object[]): object[] {
        let output: object[] = [];
        let NumOfGroups = Data.length;
        let AA: {[key: number]: any};
        AA = afterApply;
        for (let k: number = 0; k < NumOfGroups; k++) {
            let group = Data[k];
            let MinValue = this.FindMin(group, Property);
            AA[k][Name] = MinValue;
            output.push(AA[k]);
        }
        return output;
    }

    public FindMin(Group: object, Property: string): number {
        let n = Object.keys(Group).length;
        let group: {[key: number]: any};
        group = Group;
        let initial = group[0];
        let MIN = initial[Property];
        for (let j: number = 1; j < n; j++) {
            let next = group[j];
            if (next[Property] < MIN) {
                MIN = next[Property];
            }
        }
        return MIN;
    }

    public PerformMax(afterApply: object[], Name: string, Property: string, Data: object[]): object[] {
        let output: object[] = [];
        let NumOfGroups = Data.length;
        let AA: {[key: number]: any};
        AA = afterApply;
        for (let k: number = 0; k < NumOfGroups; k++) {
            let group = Data[k];
            let MaxValue = this.FindMax(group, Property);
            AA[k][Name] = MaxValue;
            output.push(AA[k]);
        }
        return output;
    }

    public FindMax(Group: object, Property: string): number {
        let n = Object.keys(Group).length;
        let group: {[key: number]: any};
        group = Group;
        let initial = group[0];
        let MAX = initial[Property];
        for (let j: number = 1; j < n; j++) {
            let next = group[j];
            if (next[Property] > MAX) {
                MAX = next[Property];
            }
        }
        return MAX;
    }

    public PerformCount(afterApply: object[], Name: string, Property: string, Data: object[]): object[] {
        let output: object[] = [];
        let NumOfGroups = Data.length;
        let AA: {[key: number]: any};
        AA = afterApply;
        for (let k: number = 0; k < NumOfGroups; k++) {
            let group = Data[k];
            AA[k][Name] = this.CountHelper(group, Property) ;
            output.push(AA[k]);
        }
        return output;
 }

 public CountHelper(Group: object, Property: string): number {
        let p = Object.keys(Group).length;
        let NoDuplicate: any[] = [];
        let initial = Object.values(Group)[0][Property];
        NoDuplicate.push(initial);
        for ( let k = 1 ; k < p; k++) {
            let next = Object.values(Group)[k][Property];
            if (NoDuplicate.indexOf(next) < 0) {
                NoDuplicate.push(next);
            }
        }
        return NoDuplicate.length;
    }

    public CalculateSum(afterApply: object[], Name: string, Property: string, Data: object[]): object[] {
        let output: object[] = [];
        let NumOfGroups = Data.length;
        let AA: {[key: number]: any};
        AA = afterApply;
        for (let k: number = 0; k < NumOfGroups ; k ++) {
            let group = Data[k];
            AA[k][Name] = this.SumHelper(group, Property) ;
            output.push(AA[k]);
        }
        return output;
    }

    public SumHelper(group: object, Property: string): number {
        let p = Object.keys(group).length;
        let Sum = 0;
        for ( let k = 0 ; k < p; k++) {
            let next = Object.values(group)[k][Property];
            Sum = Sum + next;
        }
        Sum = Number(Sum.toFixed(2));
        return Sum;
    }

    public CalculateAvg(afterApply: object[], Name: string, Property: string, Data: object[]): object[] {
        let output: object[] = [];
        let NumOfGroups = Data.length;
        let AA: {[key: number]: any};
        AA = afterApply;
        for (let k: number = 0; k < NumOfGroups ; k ++) {
            let group = Data[k];
            AA[k][Name] = this.AvgHelper(group, Property) ;
            output.push(AA[k]);
        }
        return output;
    }

    public AvgHelper(group: object, Property: string): number {
        let p = Object.keys(group).length;
        let sum  = new Decimal(0);
        for ( let k = 0 ; k < p; k++) {
           let next: number = ( Object.values(group)[k][Property]);
           let element = new Decimal(next);
           sum = sum.add(element);
        }
        let s = sum.toNumber();
        s = s / p;

        return Number(s.toFixed(2));
    }
}
