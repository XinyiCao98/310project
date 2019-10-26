import Log from "../Util";

export  default class PerformOrderHelper {
    constructor() {
        //
    }

    public OrderByString(Expected: object[], Key: string): object[] {
        let cfirst: { [key: string]: any };
        let csecond: { [key: string]: any };
        Expected.sort((cone, ctwo) => {
                cfirst = cone;
                csecond = ctwo;
                if (cfirst[Key] > csecond[Key]) {
                    return 1;
                }
                if (cfirst[Key] < csecond [Key]) {
                    return -1;
                }
                return 0;
            });
        return Expected;
    }

    public OrderByObject(Expected: object[], keys: string[], dir: string): object[] {
        let result: object[] = [];
        let initialKey = keys[0];
        let m = keys.length;
        if (dir === "UP") {
            result = this.OrderByString(Expected, initialKey);
        } else {
            let Original = this.OrderByString(Expected, initialKey);
            result = this.Reverse(Original);
        }
        if (m === 1) {
            return result;
        } else {
                result = this.SortOneMoreTime( result, keys, m , dir);
                return result;
            }
    }

    // reverse the order of an given array (might be time-consuming)
     public Reverse(Original: object[]): object[] {
        let reverse: object[] = [];
        let n = Object.keys(Original).length;
        for (let i: number = n - 1; i >= 0; i --) {
            reverse.push(Original[i]);
        }
        return reverse;
    }

    // Sort an array one more Time with Two keys
    public SortOneMoreTime(FirstSorted: object[], keys: string[], length: number, dir: string ): object[] {
        let sortedAgain: object[] = [];
        let cfirst: { [key: string]: any };
        let csecond: { [key: string]: any };
        FirstSorted.sort((cone, ctwo) => {
            cfirst = cone;
            csecond = ctwo;
            for (let m: number = 0; m < length; m++) {
                   let start = m;
                   let keysatrt = keys[start];
                   if (cfirst[keysatrt] > csecond[keysatrt]) {
                       return 1;
                   }
                   if (cfirst[keysatrt] < csecond[keysatrt]) {
                       return -1;
                   }
               }
            }
         );
        if (dir === "UP") {
            sortedAgain = FirstSorted;
        } else {
            sortedAgain = this.Reverse(FirstSorted);
        }
        return sortedAgain;
    }

}
