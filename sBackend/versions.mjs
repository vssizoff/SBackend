export function parse(str) {
    let arr = [""], a = 0, flag = false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '$') {
            a++;
            continue;
        }
        for (let j = 0; j < Math.floor(a / 2); j++) arr[arr.length - 1] += '$';
        a = a % 2;
        if (str[i] === 'v' && a) {
            if (!flag) arr.push("");
            flag = true;
            a = 0;
        }
        else if (a) {
            if (flag) arr.push("");
            flag = false;
            arr[arr.length - 1] += str[i];
            a = 0;
        }
        else arr[arr.length - 1] += str[i];
    }
    return arr.map(elem => elem.trim());
}

export function parseVersions(str) {
    return str.split(',').map((str0 => str0.split('-').map(str1 => str1.trim())));
}

export function getVersionsList(arr, versions) {
    let ans = new Set;
    for (let subArr of arr) {
        if (subArr.length < 1 || subArr.length > 2) throw new Error("Invalid Arguments");
        if (subArr.length === 1) {
            ans.add(subArr[0]);
            continue;
        }
        let [start, end] = subArr;
        for(let i = versions.indexOf(start); i <= versions.indexOf(end); i++) ans.add(versions[i]);
    }
    return Array.from(ans);
}

export function execute(str, versions) {
    let arr = parse(str), ans = [[...arr]], tmp = [];
    for (let i = 1; i < arr.length; i += 2) {
        getVersionsList(parseVersions(arr[i]), versions).forEach(version => ans.forEach(subArr => {
            let subArr0 = [...subArr];
            subArr0[i] = version;
            tmp.push([...subArr0]);
        }));
        ans = tmp;
        tmp = [];
    }
    return ans.map(subArr => subArr.join(""));
}