<img width="200" alt="aster_horizontalv2" src="https://github.com/user-attachments/assets/a337e975-996d-4672-a92b-b809591f389a" />

# Aster Themes

Aster Themes is a small CLI tool for creating themes for Aster-Apps
(themes are yet to be implemented, will be in a bit)



## Requirements

* Node.js 18+
* npm package:

```bash
npm install args
```



## Usage

Run commands using:

```bash
node index.js <command> [options]
```

## Commands

### 1. Process a theme

Turns a CSS file into a signed JSON theme.

```bash
node index.js process --file theme.css --author "Your Name" --desc "My theme" --license mit --sign y
```

#### Options

* `--file` → Path to the CSS file (defaults to `theme.css`)
* `--author` → Your name
* `--desc` → Description of the theme
* `--license` → License key (defined in `license.js`, defaults to `mit`)
* `--sign` → Use `y` to sign the theme (defaults to `n`)

#### Output

Generates a file like:

```
theme_theme.css.json
```



### 2. Verify a local theme

```bash
node index.js verify theme_theme.css.json
```

Checks the theme for:

* Valid signature
* Urls


### 3. Verify a remote theme

```bash
node index.js verifylink https://example.com/theme.json
```


### 4. Add an author

Saves a new author along with their public key in `authors.json`.

```bash
node index.js addAuthor "AuthorName" keys/pubkey.jwk "Bio text"
```


### 5. Show your public key

```bash
node index.js pub
```



## Theme format

A generated theme looks like this:

```json
{
  "header": {
    "author": "Name",
    "desc": "Description",
    "license": "...",
    "signature": "...",
    "preview": {
      "bg": "...",
      "text_primary": "..."
    }
  },
  "content": "CSS HERE"
}
```



## Notes

* URLs inside theme content and preview are blocked unless explicitly allowed
* If you wish to add a theme, please submit it in Pull Requests, please also send your public key along with it!


