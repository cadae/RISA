from flask import Flask,request,jsonify
from flask_cors import CORS
import wikipediaapi
import requests
import json
import doc
from textblob import TextBlob
from google_search.search_client import GoogleSearchClient
from bert import Ner

client = GoogleSearchClient()

QA_ENDPOINT = "http://localhost:8000/predict"
wiki = wikipediaapi.Wikipedia('en')
app = Flask(__name__)
CORS(app)

model = Ner("model")

@app.route("/predict",methods=['POST'])
def predict():
    text = request.json["text"]
    if text[-1] != "?":
        text += "?"
    print(text)
    try:
        named_entities = model.predict(text)
        print(named_entities)
        documents=""
        noun_phrases = []
        wiki_words = []
        words = ""
        num_of_noun_phrase = 0
        for word in named_entities:
            if word["word"].lower() in doc.BLOODWATCH_KEY_WORDS:
                documents += doc.BLOODWATCH+" "
                return QAModel(documents,text)
            if word["word"].lower() in doc.LEMTRADA_KEY_WORDS:
                documents += doc.LEMTRADA+" "
                return QAModel(documents,text)
            if word["tag"][0]=="B":
                noun_phrases.append(word["word"]+" ")
                num_of_noun_phrase += 1
            elif word["tag"][0]=="I":
                noun_phrases[num_of_noun_phrase-1] += word["word"]+" "
        for noun_phrase in noun_phrases:
            results = client.search("site:en.wikipedia.org "+noun_phrase)
            temp = (json.loads(results.to_json()))[0]["url"].rsplit("wiki/")[-1]
            print("NER: "+temp)
            if len(temp) > 1:
                wiki_words.append(temp)
                page_py = wiki.page(temp)
                documents += page_py.summary+" "

        for (word, pos) in TextBlob(text).pos_tags:
            if pos[0] == 'N':
                words += word+" "
        results = client.search("site:en.wikipedia.org "+words)
        temp = (json.loads(results.to_json()))[0]["url"].rsplit("wiki/")[-1]
        print("POS: "+temp)
        if temp not in wiki_words and len(temp) > 1:
            wiki_words.append(temp)
            page_py = wiki.page(temp)
            documents += page_py.summary+" "

        results = client.search("site:en.wikipedia.org "+text)
        temp = (json.loads(results.to_json()))[0]["url"].rsplit("wiki/")[-1]
        print("GOOGLE: "+temp)
        if temp not in wiki_words and len(temp) > 1:
            wiki_words.append(temp)
            page_py = wiki.page(temp)
            documents += page_py.summary+" "
        return QAModel(documents,text)

    except Exception as e:
        print(e)
        return jsonify({"result":"Model Failed "+str(e)})

def QAModel(documents,text):
    if documents!="" and len(documents)>10:
        print(documents)
        data = {'document':documents, 
                'question':text}
        headers = {'content-type': 'application/json'}
        response = requests.post(url = QA_ENDPOINT, data = json.dumps(data), headers = headers)
        out = json.loads(response.text)
        if out["result"]["answer"] == ".":
            out["result"]["answer"] = "The AI is traped in an existential crisis right now. Please ask other questions."
    else:
        return jsonify({"result":"I couldn't find the wiki page for this topic."})
    return out

if __name__ == "__main__":
    app.run('0.0.0.0',port=8001,debug=True)