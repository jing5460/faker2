
/*
转赚红包
执行流程，车头输出助力码--助力--抽奖--检查提现
可指定PIN车头，不指定默认CK1， 变量 JDZHBTOPPIN='jdpin'
多少助力换下一个车头，默认9999个 ，控制变量 JDZHBNUM='100';
运行一次抽奖次数,默认抽完，控制变量 JDZHBLTNUM='200'
每次抽奖间隔，默认1秒，控制变量 JDZHBDELAY='3'
开启提现到上限转红包 JDZHBTORED='true'
代理变量DY_PROXY='https://api'，仅对助力使用，支持类星空的api 
不提现变量 NOTX='true' 默认提现
12 * * * * jd_yhyhb.js
updatetime:20231027
 */

const $ = new Env('Jd邀好友领红包');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const dy = require('./function/dylanz');
const ua = require('./USER_AGENTS');
let jdNotify = true, invcode = [], txlist = [], redlist = [], cashlist = [], ccc;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message = '', authcode = '', mm;
let helpnum = process.env.JDZHBNUM || '9999';
let topnum = process.env.JDZHBTOP || '5';
let ltnum = process.env.JDZHBLTNUM || '-1';
let delay = process.env.JDZHBDELAY || '1';
let tored = process.env.JDZHBTORED || false;
let toppin = process.env.JDZHBTOPPIN || '';
let silent = process.env.TXSILENT || false;
let notx = process.env.NOTX ? process.env.NOTX : false;
if (process.env.DY_PROXY) {
    try {
        require("https-proxy-agent");
        ccc = require('./function/proxy.js')
        $.dget = ccc.intoRequest($.get.bind($));
        $.dpost = ccc.intoRequest($.post.bind($));
    } catch {
        $.log('未安装https-proxy-agent依赖，无法启用代理');
        $.dpost = $.post
    }
} else { $.dpost = $.post }
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => { };
} else {
    cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonfomat($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
$.banip = false;
!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
        return;
    }
    $.log(`\n❗❗❗请注意此活动助力机会是24小时一次，不是0点刷新❗❗❗`);
    $.log(`\n活动日期 20231027-20231112 100提现金`);
    console.log(`执行流程，车头开团--助力--抽奖--提现 By Dylan Faker Fix`);
    console.log('Faker 频道https://t.me/scriptalking：');
    let authcode = await getcode();

    if (toppin) {
        console.log('\n已指定PIN：' + toppin);
        let index = cookiesArr.findIndex(item => item.includes(toppin));
        if (index == -1) { console.log('运行的CK中没找到指定的PIN，停止执行！'); return };
        cookie = cookiesArr[index];
    } else {
        console.log('\n未指定PIN默认CK1车头');
        cookie = cookiesArr[0];
    }

    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
    $.isLogin = true;
    $.nickName = '';
    $.UA = ua.UARAM ? ua.UARAM() : ua.USER_AGENT;
    console.log(`\n——————————————车头开团——————————————`);
    console.log(`账号：${$.nickName || $.UserName}`);
    await TotalBean();
    if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `账号${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
        if ($.isNode()) {
            await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `账号 ${$.UserName}\n请重新登录获取cookie`);
        }
        return;
    }

    await homeinfo(1);
    await $.wait(1000)

    if (authcode.length != 0) {
        let s = authcode[Math.floor(Math.random() * authcode.length)];
        console.log('车头去助力 -> 作者');
        $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        $.UA = ua.UARAM ? ua.UARAM() : ua.USER_AGENT;
        await help(s);
        await $.wait(2000);
    }

    console.log('————————————————————————————————————');


    console.log('\n\n开始助力车头...')
    mm = 0;
    for (let code of invcode) {
        if ($.banip) break;
        if (cookiesArr.length === 1) { console.log(''); break };
        console.log(`\n去助力-> ${code}`);
        $.suc = 0;
        $.alr = 0;
        $.nhp = 0;
        for (let i = mm; i < cookiesArr.length; i++) {
            if (cookiesArr[i]) {
                cookie = cookiesArr[i];
                $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
                $.index = i + 1;
                $.isLogin = true;
                $.nickName = '';
                $.UA = ua.UARAM ? ua.UARAM() : ua.USER_AGENT;
                console.log(`\n开始【账号${$.index}】 ${$.nickName || $.UserName}\n`);
                await help(code);
                if ($.suc > Number(helpnum) + 1) { $.log('已达目标助力数，跳出！'); mm = i + 1; break };
                //if ($.alr > 2 || $.nhp > 2) { $.log('\n连续3次助力失败，节省时间，跳出'); $.index = cookiesArr.length; break };
                await $.wait(1000);
            }
        }
        if ($.index === cookiesArr.length) { console.log('\n没有可用于助力的ck，跳出！'); break };
    }
    console.log('\n\n开始抽奖和提现...');
    (ltnum > -1) && console.log(`\n已设置本次运行抽奖次数 ${ltnum}`);
    let threeday = new Date();
    threeday.setDate(threeday.getDate() - 1);
    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
            $.index = i + 1;
            $.isLogin = true;
            $.nickName = '';
            $.fail = 0;
            txlist = [], redlist = [];
            $.txj = true;
            $.fg = 1;
            $.txfull = false;
            $.nocashnum = 0;
            $.end = false;
            $.hotflag = false;
            $.toredfailnum = 0;
            $.UA = ua.UARAM ? ua.UARAM() : ua.USER_AGENT;
            console.log(`\n\n--------开始【账号${$.index}】 ${$.nickName || $.UserName}----------\n`);
            let res = await homeinfo(0);
            if (res.code != '0') continue;
            $.log(`本轮已抽奖次数：${res.data.drawPrizeNum}`);
            $.log(`当前剩余抽奖次数：${$.times}`);
            $.log(`本轮结束时间： ${formatdate(new Date(Date.now() + res.data.countDownTime))}\n`);

            for (let i = 0; i < ((ltnum > -1 && ltnum < $.times) ? ltnum : $.times); i++) {
                if ($.banip) break;
                process.stdout.write(`\n第${i + 1}次抽奖结果：`);
                for (let i of Array(3)) {
                    await lottery(i + 1);
                    if (!$.hotflag) break;
                    await $.wait(Math.random() * 500 + delay * 1000);
                }
                if ($.end) break;
                $.txj && await receive();
                await $.wait(Math.random() * 500 + delay * 1000);
                if ($.fail > 2) { $.log('连续3次优惠券，不继续抽了'); break };
            }
            redlist.length !== 0 && $.log(`\n\n本次抽奖获得红包总计：${redlist.reduce((x, y) => x + y * 100, 0) / 100}元`);
            txlist.length !== 0 && $.log(`\n本次抽奖获得现金总计：${txlist.reduce((x, y) => x + y * 100, 0) / 100}元`);
            // for (let j = 0; j < 15; j++) {
            //     await superRedBagList(j + 1);
            //     await $.wait(400);
            //     if (!$.baglist || $.baglist.length === 0) break;

            //}

            if (notx != 'true') {
                if (new Date().getHours() < 6 && silent) continue;
                $.log(`\n开始提现(遍历奖励列表)...`);
                tored && $.log(`\n已开启转红包，提现上限后会自动转红包！！\n`);
                for (let j = 0; j < 50; j++) {
                    if ($.nocashnum > 2 || $.toredfailnum > 4) break;
                    if ($.txfull && !tored) { $.log(`\n本月提现到上限!如转红包请设置变量`); break };

                    await superRedBagList(j + 1);
                    //console.log((j + 1) + '页');
                    await $.wait(1000);
                    if (!$.baglist || $.baglist.length === 0) break;
                    for (let i of $.baglist) {
                        if (new Date(i.createTime) < threeday || $.toredfailnum > 4) { $.nocashnum = 5; break };
                        if (i.prizeType == 4) {
                            if (i.state == 0 || i.state == 2) {//0是待提现 2提现失败 3提现完成  4兑红包
                                process.stdout.write(`${Number(i.amount)}`);
                                let res = await apCashWithDraw(i);
                                if ($.txfail) {
                                    await $.wait(3000);
                                    res = await apCashWithDraw(i);
                                }
                                if ($.txfull && !tored) break;
                                await $.wait(1000);
                                if (res.data.message.includes('上限') && tored && $.toredfailnum < 5) await apRecompenseDrawPrize(i);
                                await $.wait(4000);
                                //$.nocashnum = 0;
                            } else if (i.state == 8) {
                                //$.nocashnum++;
                                // process.stdout.write(`${Number(i.amount)}`);
                                // await apRecompenseDrawPrize(i);
                                // await $.wait(1000);
                            }
                        }
                    }
                }
            } else {
                $.log(`\n\n⚠已设置不提现！`);
            }
            cashlist = [];
            await $.wait(2000)
        }
    }

})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })



async function homeinfo(flag) {
    let body = `functionId=inviteFissionHome&body={"linkId":"EcuVpjGGfccY3Ic_1ni83w","inviter":""}&t=${Date.now()}&appid=activities_platform&client=ios&clientVersion=${$.UA.split(';')[2]}`;
    return new Promise(async (resolve) => {
        $.post(getUrl(body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`homeinfo请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data)
                    if (data.code == 0) {
                        $.times = data.data.prizeNum;
                        if (flag) console.log(`助力码：${data.data.inviter}`);
                        invcode.push(data.data.inviter);
                    } else {
                        console.log(data.errMsg)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
async function receive() {
    //let body = `functionId=inviteFissionReceive&body=&t=${Date.now()}&appid=activities_platform&client=ios&clientVersion=${$.UA.split(';')[2]}`;
    let body = { "linkId": "EcuVpjGGfccY3Ic_1ni83w" };
    let data = {
        appId: 'b8469',
        fn: 'inviteFissionReceive',
        body,
        apid: 'activities_platform',
        ver: $.UA.split(';')[2],
        cl: 'ios',
        user: $.UserName,
        code: 1,
        //xcr: fg,
        ua: $.UA
    };
    ($.fg == 1) && ($.fg = 0);
    body = await dy.getbody(data);
    if (!body) return;
    return new Promise(async (resolve) => {
        $.post(getUrl(body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`);
                    console.log(`receive请求失败，请检查网路重试`);
                    if (err.includes('403')) {
                        $.banip = true;
                    }
                } else {
                    data = JSON.parse(data)
                    if (data.code == 0) {
                        $.log(`----提现金：${data.data.amount}`);
                    } else {
                        //console.log(data.errMsg);
                        $.txj = false;
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
async function lottery(times) {
    let body = { "linkId": "EcuVpjGGfccY3Ic_1ni83w" };
    let data = {
        appId: 'c02c6',
        fn: 'inviteFissionDrawPrize',
        body,
        apid: 'activities_platform',
        ver: $.UA.split(';')[2],
        cl: 'ios',
        user: $.UserName,
        code: 1,
        xcr: $.fg,
        ua: $.UA
    };
    ($.fg == 1) && ($.fg = 0);
    body = await dy.getbody(data);
    if (!body) return;
    return new Promise(async (resolve) => {
        $.post(getUrl(body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`);
                    console.log(`lottery请求失败，请检查网路重试`);
                    if (err.includes('403')) {
                        $.banip = true;
                    }
                } else {
                    data = JSON.parse(data)
                    if (data.code == 0) {
                        const type = data.data.prizeType;
                        if (!type) fail++;
                        switch (type) {
                            case 1:
                                //console.log(`第${times}次抽奖结果：垃圾卷😤`);
                                process.stdout.write(`垃圾卷😤`);
                                $.fail++;
                                $.hotflag = false;
                                break;
                            // case 6:
                            //     console.log(`第${times}次抽奖结果：京喜礼包 💩`);
                            //     //$.fail++;
                            //     break;
                            case 4:
                                let tx = parseFloat(data.data.prizeValue).toFixed(2);
                                //console.log(`第${times}次抽奖结果：${tx}现金 💰️`);
                                process.stdout.write(`${tx}现金💰️`);
                                txlist.push(tx);
                                cashlist.push({
                                    prizeValue: data.data.prizeValue,
                                    id: data.data.id,
                                    poolBaseId: data.data.poolBaseId,
                                    prizeGroupId: data.data.prizeGroupId,
                                    prizeBaseId: data.data.prizeBaseId,
                                })
                                $.fail = 0;
                                $.hotflag = false;
                                break;
                            case 2:
                                let red = parseFloat(data.data.prizeValue).toFixed(2);
                                process.stdout.write(`${red}红包🧧 `);
                                redlist.push(red);
                                $.fail = 0;
                                $.hotflag = false;
                                break;
                            default:
                                $.hotflag = false;
                                console.log(JSON.stringify(data.data));
                        }
                    } else if (data.errMsg.includes('火爆')) {
                        process.stdout.write('未中奖 ');
                        $.hotflag = true;
                    } else if (data.errMsg.includes('结束')) {
                        $.end = true;
                        $.hotflag = false;
                        console.log(data.errMsg)
                    } else {
                        $.hotflag = false;
                        console.log(data.errMsg)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
async function superRedBagList(i) {
    let body = { "pageNum": i, "pageSize": 100, "linkId": "EcuVpjGGfccY3Ic_1ni83w", "business": "fission" };
    let data = {
        appId: 'f2b1d',
        fn: 'superRedBagList',
        body,
        apid: 'activities_platform',
        ver: $.UA.split(';')[2],
        cl: 'ios',
        user: $.UserName,
        code: 1,
        //xcr: fg,
        ua: $.UA
    };
    body = await dy.getbody(data);
    if (!body) return;
    return new Promise(async (resolve) => {
        $.get(getUrl(body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`);
                    console.log(` API请求失败，请检查网路重试`);
                    if (err.includes('403')) {
                        $.banip = true;
                    }
                } else {
                    data = JSON.parse(data)
                    if (data.code == 0) {
                        $.baglist = data.data.items;
                    } else {
                        console.log(data.errMsg)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
async function help(d) {
    let body = { "linkId": "EcuVpjGGfccY3Ic_1ni83w", "isJdApp": true, "inviter": d };
    let data = {
        appId: '02f8d',
        fn: 'inviteFissionhelp',
        body,
        apid: 'activities_platform',
        ver: $.UA.split(';')[2],
        cl: 'ios',
        user: $.UserName,
        code: 1,
        xcr: 1,
        ua: $.UA,
    };
    body = await dy.getbody(data);
    if (!body) return;
    return new Promise(async (resolve) => {
        $.dpost(getUrl(body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`);
                    console.log(`help请求失败，请检查网路重试`);
                    if (err.includes('403')) {
                        $.banip = true;
                    }
                } else {
                    data = JSON.parse(data)
                    if (data.code == 0) {
                        if (!data.data.helpFlg) { $.log('结果：不能助力自己！'); return };
                        if (data.data.helpResult == 1) {
                            $.suc++;
                            $.alr = 0;
                            console.log(`结果：助力成功 ✅ ${$.suc || ''}`);
                        } else if (data.data.helpResult == 6) {
                            console.log('结果：已经助力过TA！');
                            $.alr++;
                        } else if (data.data.helpResult == 3) {
                            console.log('结果：没有次数了！');
                            $.nohelp = true;
                            $.nhp++;
                        } else if (data.data.helpResult == 2) {
                            $.log('结果：助力黑了 💣');
                            $.hot = true;
                        } else if (data.data.helpResult == 4) {
                            $.log('结果：没有助力次数！');
                            $.nhp++;
                        } else if (data.data.helpResult == 8) {
                            $.log('结果：TA未开启新的一轮 💤');
                        } else {
                            console.log(JSON.stringify(data));
                        }

                    } else {
                        console.log(data.errMsg)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
async function apCashWithDraw(i) {
    let body = `functionId=apCashWithDraw&body={"linkId":"EcuVpjGGfccY3Ic_1ni83w","businessSource":"NONE","base":{"id":${i.id},"business":"fission","poolBaseId":${i.poolBaseId},"prizeGroupId":${i.prizeGroupId},"prizeBaseId":${i.prizeBaseId},"prizeType":4}}&t=${Date.now()}&appid=activities_platform&client=ios&clientVersion=${$.UA.split(';')[2]}`;
    return new Promise(async (resolve) => {
        $.post(getUrl(body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`);
                    console.log(`apCashWithDraw请求失败，请检查网路重试`);
                    if (err.includes('403')) {
                        $.banip = true;
                    }
                } else {
                    data = JSON.parse(data);
                    if (data.code == 0) {
                        if (data.data.message.indexOf('待发放') > -1) {
                            process.stdout.write('❎');
                            $.txfail = true;
                        } else if (data.data.message.includes('上限')) {
                            $.txfull = true;
                        } else if (data.data.message.includes('提现')) {
                            process.stdout.write('✅ ');
                            $.txfail = false;
                        } else {
                            console.log(data.data.message);
                        }
                    } else {
                        console.log(data.errMsg);
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
function apRecompenseDrawPrize(i) {
    let body = `functionId=apRecompenseDrawPrize&body={"drawRecordId":${i.id},"business":"fission","poolId":${i.poolBaseId},"prizeGroupId":${i.prizeGroupId},"prizeId":${i.prizeBaseId},"linkId":"EcuVpjGGfccY3Ic_1ni83w"}&t=${Date.now()}&appid=activities_platform&client=ios&clientVersion=${$.UA.split(';')[2]}`;
    let opt = {
        url: `https://api.m.jd.com/api`,
        body,
        headers: {
            'Host': 'api.m.jd.com',
            'Origin': 'https://prodev.m.jd.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    return new Promise(async (resolve) => {
        $.post(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`);
                    console.log(`apRecompenseDrawPrize 请求失败，请检查网路重试`);
                    if (err.includes('403')) {
                        $.banip = true;
                    }
                } else {
                    data = JSON.parse(data);
                    if (data.code == 0) {
                        if (data.data.resCode === '0') {
                            process.stdout.write('🧧 ');
                        } else {
                            process.stdout.write('❎ ');
                            $.toredfailnum++;
                        }
                    } else if (data.errMsg === '失败') {
                        process.stdout.write('❎ ');
                        $.toredfailnum++;
                    } else {
                        console.log(data.errMsg);
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
function getUrl(body) {
    return {
        url: `https://api.m.jd.com/?${body}`,
        //body,
        headers: {
            'Host': 'api.m.jd.com',
            'Origin': 'https://prodev.m.jd.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
}
function TotalBean() {
    return new Promise((resolve) => {
        const options = {
            url: 'https://plogin.m.jd.com/cgi-bin/ml/islogin',
            headers: {
                "Cookie": cookie,
                "referer": "https://h5.m.jd.com/",
                "User-Agent": $.UA,
            },
            timeout: 10000
        }
        $.get(options, (err, resp, data) => {
            try {
                if (data) {
                    data = JSON.parse(data);
                    if (data.islogin === "1") {
                    } else if (data.islogin === "0") {
                        $.isLogin = false;
                    }
                }
            } catch (e) {
                console.log(e);
            }
            finally {
                resolve();
            }
        });
    });
}

function showMsg() {
    return new Promise(resolve => {
        if (!jdNotify) {
            $.msg($.name, '', `${message}`);
        } else {
            $.log(`京东账号${$.index}${$.nickName}\n${message}`);
        }
        resolve()
    })
}
if ('6dy' == 'lan') return;
function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        }
    } catch (e) {
        console.log(e);
        console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
        return false;
    }
}
if ('6dy' == 'lan') return;
function getcode() {
    let opt = {
        url: 'https://updateteam.oss-cn-hangzhou.aliyuncs.com/jdyhy.json',
        timeout: 30000
    }
    return new Promise((resolve) => {
        $.get(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`\n服务连接失败，终止执行！`)
                    process.exit(111);
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data.code === 200) {
                            authcode = data.data;
                        } else {
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(authcode);
            }
        })
    })
}
function formatdate(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}
function jsonfomat(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return [];
        }
    }
}
if ('6dy' == '0') return;
function api(xxx) {
    let opt = {
        url: `http://123.57.164.4:8080/cxj`,
        body: JSON.stringify(xxx),
        headers: {
            "Content-Type": "application/json"
        },
        timeout: 10000
    }, str = '';
    return new Promise((resolve) => {
        $.post(opt, (err, resp, data) => {
            try {
                if (err) {
                    //console.log(JSON.stringify(err));
                    console.log('连接失败');
                    //process.exit(111);
                } else {
                    data = JSON.parse(data);
                    if (data.code == 200) {
                        str = data.data;
                    } else {
                        $.log(data.msg);
                    }
                }
            } catch (e) {
                console.log(e, resp);
            } finally {
                resolve(str);
            }
        })
    })
}
function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }