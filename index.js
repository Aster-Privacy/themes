const fs = require("fs")
const args = require('args')

const license = require("./license.js")
const crypto = require("crypto")
const path = require("path")
let ctx = {
    author: "Anonymous",
    desc: "A theme"
}
const containsURL = (Value) => {
    let str = Value.normalize("NFC").trim();
    if (!str) return;
    let res = str.match(/https?:\/\/[^\s]+/);
    if (!res) return;
    if (res) return true;
}
class themeObj {
    allowsURLs = false
    constructor(data) {
        this.raw = data
        let pure = this.raw.split("\n")
        pure.shift()
        this.pure = pure.join("\n")
    }
    parse() {
        let lines = this.raw.split("\n")
        let header
        try {
            let jsonPart = lines[0].slice(3, -3)
            header = JSON.parse(jsonPart)
        } catch (err) {
            
        }
        if (!header) {
            console.error("Theme does not have a header")
            return
        }
        this.header = header
    }
    parseJSON(){
        let json = JSON.parse(this.raw)
        this.header = json.header
        this.pure = json.content
    }
    securityCheck() {
        if (!this.verified&&this.verificationAttempted){
            return [false]
        }
        if (this.allowsURLs){
            
        } else {
            
            if (containsURL(this.pure)){
                return [false]
            }
            if (containsURL(JSON.stringify(this.header.preview))){
                return [false]
            }
        }
        return [true]
    }
    async verify() {
        this.verificationAttempted = true
        if (!this.header) {

            return [false, "no header"]
        }
        let authorsRaw = await fetch("https://raw.githubusercontent.com/Aster-Privacy/themes/refs/heads/main/authors.json")
        let authors = await authorsRaw.json()
        let themeAuthor = authors[this.header.author]
        if (!themeAuthor) {

            return [false, "author not found"]
        }
        let pubKey = crypto.createPublicKey({ format: "jwk", key: themeAuthor.pub })
        if (!pubKey) {
            return [false, "no key"]
        }
        let pure = Buffer.from(this.pure, "utf8")
        let signature = Buffer.from(this.header.signature)
        
        let vResult = crypto.verify(undefined, pure, pubKey, signature)
        if (vResult) {
            this.verified = true
        }
        return [vResult]
    }
}
function getPreview(str) {
    const vars = {};
    const re = /--([\w-]+)\s*:\s*([^;]+);/g;

    let m;
    while ((m = re.exec(str)) !== null) {
        vars[m[1]] = m[2].trim();
    }

    return {
        bg: vars["bg-primary"],
        sidebar_bg: vars["sidebar-bg"],
        sidebar_border: vars["sidebar-border"],
        brand: vars["chart-1"],

        text_primary: vars["text-primary"],
        text_secondary: vars["text-secondary"],
        text_tertiary: vars["text-tertiary"],
        text_muted: vars["text-muted"],

        selected_bg: vars["bg-selected"],
        indicator_bg: vars["indicator-bg"],
        indicator_border: vars["indicator-border"],

        border: vars["border"],
        border_secondary: vars["border-secondary"],
        body_line: vars["border-thread-divider"],

        avatar_read: vars["avatar-bg"],
        modal_overlay: vars["modal-overlay"],
    };
}
function processCSS(str) {
    let preview = getPreview(str)
    let header = ctx
    header.preview = preview
    return header

}
args
    .option('command', 'process', "process")
    .option('file', 'file to process', "theme.css")
    .option("author", "Your name", "Anonymous")
    .option("license", "License", "mit")
    .option("desc", "Description of this theme", "N/A")
    .option("sign", "Sign the css?", "n")
    .command("addAuthor", "Adds a author to authors.json", addAuthor)
    .command("verify", "Verifies a theme", verifyTheme)
    .command("verifylink", "Verifies a link theme", verifyThemeOnline)
    .command("pub","Prints your publickey",()=>{
        let keys = getKeys()
        console.log(keys.publicKey.asymmetricKeyDetails)
        console.log(keys.publicKey.asymmetricKeyType)
        console.log(keys.publicKey.symmetricKeySize)
        console.log(keys.publicKey.asymmetricKeyDetails)
        console.log("Public Key is below.")
        console.log(JSON.stringify(keys.publicKey.export({format:"jwk"})))
    })

const flags = args.parse(process.argv)

ctx.author = flags.author
ctx.desc = flags.desc

function getKeys() {
    let keysExist = fs.existsSync("keys.json")
    let keys
    if (keysExist) {
        let data = JSON.parse(fs.readFileSync("keys.json", "utf8"))
        keys = {
            privateKey: crypto.createPrivateKey({ key: data.privateKey, format: "jwk" }),
            publicKey: crypto.createPublicKey({ key: data.publicKey, format: "jwk" })
        }
    } else {
        keys = crypto.generateKeyPairSync("ed25519");
        let saved = {
            publicKey: keys.publicKey.export({ format: "jwk" }),
            privateKey: keys.privateKey.export({ format: "jwk" }),
        }
        fs.writeFileSync("keys.json", JSON.stringify(saved))
    }
    return keys
}

async function verifyTheme(cmd, args) {
    let fileName = args[0]

    if (!fileName || !fs.existsSync(fileName)) {
        console.error("File does not exist")
        return
    }
    let fileContents = fs.readFileSync(fileName, "utf8")
    console.log(fileContents.length)
    let nTheme = new themeObj(fileContents)
    await nTheme.parseJSON()
    let res = await nTheme.verify()
    console.log(`${res[0]?"Signature is correct":"Signature is incorrect"}${res[1]?"\n"+res[1]:""}`)

    let securityRes = nTheme.securityCheck()
    console.log(`${securityRes[0]?"Security Check passed":"Security Check failed"}${securityRes[1]?"\n"+securityRes[1]:""}`)
}
async function verifyThemeOnline(cmd, args) {
    let fileName = args[0]

    fileContents = await fetch(fileName)
    fileContents = await fileContents.text()
    console.log(fileContents.length)
    let nTheme = new themeObj(fileContents)
    await nTheme.parseJSON()
    let res = await nTheme.verify()
    console.log(`${res[0]?"Signature is correct":"Signature is incorrect"}${res[1]?"\n"+res[1]:""}`)

    let securityRes = nTheme.securityCheck()
    console.log(`${securityRes[0]?"Security Check passed":"Security Check failed"}${securityRes[1]?"\n"+securityRes[1]:""}`)
}
function addAuthor(cmd, args) {
    let authorName = args[0]
    let keyDir = args[1]
    let desc = args[2]
    let authorsExist = fs.existsSync("authors.json")
    let authors = {}
    if (authorsExist) {
        authors = JSON.parse(fs.readFileSync("authors.json", "utf8"))
    }
    let pubKey

    let fileEnding = keyDir.split(".")[1] || "jwk"

    let existsAtRoot = fs.existsSync(keyDir)
    if (!existsAtRoot) {
        keyDir = path.join("keys", keyDir)
    }
    if (fileEnding == "jwk") {
        let pubKeyRaw = JSON.parse(fs.readFileSync(keyDir, "utf8"))
        pubKey = crypto.createPublicKey({ key: pubKeyRaw, format: "jwk" })
    }
    if (!pubKey) {
        console.error("No publickey given")
        return
    }
    authors[authorName] = {
        pub: pubKey.export({ format: "jwk" }),
        bio: desc
    }
    console.log(`Success: Author added`)
    fs.writeFileSync("authors.json", JSON.stringify(authors))
}

function signText(txt) {

    let keys = getKeys()


    const signed = crypto.sign(
        undefined,
        Buffer.from(txt, "utf8"),
        keys.privateKey
    );

    return signed
}

let data

if (flags.command == "process") {
    let originalFileName = path.basename(flags.file)
    
    if (!fs.existsSync(flags.file)){
        flags.file = path.join("css",flags.file)
        if (!fs.existsSync(flags.file)){
            console.error("File does not exist!")
            return
        }
    }
    let fileContents = fs.readFileSync(flags.file, "utf8")
    fileContents = fileContents.normalize("NFC").trim()
    let header = processCSS(fileContents)

    let licenseSample = license[flags.license]
    let myLicense = licenseSample.replace("%author", flags.author)
    header.license = myLicense
    if (flags.sign) {
        let signature = signText(fileContents)
        header.signature = signature
    }
    let data = JSON.stringify({
        header:header,
        content:fileContents
    })


    fs.writeFileSync(path.join("json",`theme_${originalFileName}.json`), data)
}

