Marvel
======

Browse the Marvel API from the command line with nodejs

Install dependencies with npm
```
npm install
```

Sign up for a Marvel account and get an API key over at http://developer.marvel.com

Put your public and private API keys in a config file in your checkout, like this

```
{
  "publickey": "00000000000000000",
  "privatekey": "111111111111111111"
}
```

Run the marvel API browser from the command line:
```
./marvel characters --nameStartsWith=Thor
```

You can use the following commands:
- comics
- characters
- creators
- events
- series
- stories

You can pass any additional parameters identifid in the Marvel API docs here http://developer.marvel.com/docs

Many thanks to Marvel for exposing and documenting their API, and for awesome comics and awesome movies too!
