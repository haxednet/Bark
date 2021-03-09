/*
    this code is used to prevent homoglyph attacks
*/
let hyph=[];
hyph['!']='!ǃ！';
hyph['"']='"״″＂';
hyph['$']='$＄';
hyph['%']='%％';
hyph['&']='&＆';
hyph["'"]="'＇";
hyph['(']='(﹝（';
hyph[')']=')﹞）';
hyph['*']='*⁎＊';
hyph['+']='+＋';
hyph[',']=',‚，';
hyph['-']='-‐𐆑－';
hyph['.']='.٠۔܁܂․‧。．｡';
hyph['/']='/̸⁄∕╱⫻⫽／ﾉ';
hyph['0']="0OoΟοОоՕ𐒆Ｏｏ";
hyph['o']='Oo0ΟοОоՕ𐒆Ｏｏ';
hyph['1']='1Iا１';
hyph['2']='2２';
hyph['3']='3３';
hyph['4']='4４';
hyph['5']='5５';
hyph['6']='6６';
hyph['7']='7𐒇７';
hyph['8']='8Ց８';
hyph['9']='9９';
hyph[':']=':։܃܄∶꞉：';
hyph[';']=';;；';
hyph['<']='<‹＜';
hyph['=']='=𐆐＝';
hyph['>']='>›＞';
hyph['?']='?？';
hyph['@']='@＠';
hyph['[']='[［';
hyph['\\']='\\＼';
hyph[']']=']］';
hyph['^']='^＾';
hyph['_']='_＿';
hyph['`']='`｀';
hyph['a']='AaÀÁÂÃÄÅàáâãäåɑΑαаᎪＡａ';
hyph['b']='BbßʙΒβВЬᏴᛒＢｂ';
hyph['c']='CcϲϹСсᏟⅭⅽ𐒨Ｃｃ';
hyph['d']='DdĎďĐđԁժᎠḍⅮⅾＤｄ';
hyph['e']='EeÈÉÊËéêëĒēĔĕĖėĘĚěΕЕеᎬＥｅ';
hyph['f']='FfϜＦｆ';
hyph['g']='GgɡɢԌնᏀＧｇ';
hyph['h']='HhʜΗНһᎻＨｈ';
hyph['i']='IilɩΙІіاᎥᛁⅠⅰ𐒃Ｉｉ';
hyph['j']='JjϳЈјյᎫＪｊ';
hyph['k']='KkΚκКᏦᛕKＫｋ';
hyph['l']='LlʟιاᏞⅬⅼＬｌ';
hyph['m']='MmΜϺМᎷᛖⅯⅿＭｍ';
hyph['n']='NnɴΝＮｎ';
hyph['0']="0OoΟοОоՕ𐒆Ｏｏ";
hyph['o']='Oo0ΟοОоՕ𐒆Ｏｏ';
hyph['p']='PpΡρРрᏢＰｐ';
hyph['q']='QqႭႳＱｑ';
hyph['r']='RrʀԻᏒᚱＲｒ';
hyph['s']='SsЅѕՏႽᏚ𐒖Ｓｓ';
hyph['t']='TtΤτТᎢＴｔ';
hyph['u']='UuμυԱՍ⋃Ｕｕ';
hyph['v']='VvνѴѵᏙⅤⅴＶｖ';
hyph['w']='WwѡᎳＷｗ';
hyph['x']='XxΧχХхⅩⅹＸｘ';
hyph['y']='YyʏΥγуҮＹｙ';
hyph['z']='ZzΖᏃＺｚ';
hyph['{']='{｛';
hyph['|']='|ǀا｜';
hyph['}']='}｝';

const homoglyph = {
    stringify: (e)=>{
        let parsed = e.toLowerCase().split("");
        for(let i in parsed){
            for(let x in hyph){
                if(hyph[x].indexOf(parsed[i])>-1){
                    parsed[i] = x;
                }
            }
        }
        return parsed.join("").replace(/[^ -~]+/g, "");
    }
}

module.exports = homoglyph;