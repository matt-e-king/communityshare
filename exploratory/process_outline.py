import sys
import os
import re
import time
import sqlalchemy
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Float, String, Integer
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

import wikipedia
from nltk.stem.lancaster import LancasterStemmer
import nltk
from nltk.corpus import wordnet

Base = declarative_base()

class StemFreq(Base):
    __tablename__ = 'stemfreq'
    stem = Column(String(100), primary_key=True)
    title = Column(String(100), primary_key=True)
    freq = Column(Float)

    
engine = create_engine('postgresql://ben@localhost/stemfreq')
Base.metadata.create_all(engine)
session = scoped_session(sessionmaker(bind=engine))

stemmer = LancasterStemmer()

def match_text(text):
    words = nltk.word_tokenize(text)
    stems = [stemmer.stem(word) for word in words]
    titles = {}
    contribs = {}
    for stem in stems:
        sfs = session.query(StemFreq).filter(StemFreq.stem==stem).all()
        total = sum([sf.freq for sf in sfs])
        for sf in sfs:
            if sf.title not in titles:
                titles[sf.title] = []
                contribs[sf.title] = {}
            if stem not in contribs[sf.title]:
                contribs[sf.title][stem] = sf.freq/total    
            titles[sf.title].append(sf.freq/total)
    compos = []
    for title in titles:
        scores = titles[title]
        score = sum(scores)
        compos.append((score, title))
    compos.sort()
    compos.reverse()
    return compos
    

def get_text(name, backup_name):
    ofn = os.path.join('raw_wikipedia', name + '.txt')
    if not os.path.exists(ofn):
        print('Getting {} frome wikipedia'.format(name))
        try:
            ipage = wikipedia.page(name)
        except (wikipedia.exceptions.DisambiguationError, wikipedia.exceptions.PageError):
            ipage = wikipedia.page(backup_name)
        content = ipage.content
        with open(ofn, 'w') as f:
            f.write(content)
        time.sleep(1)
    else:
        with open(ofn, 'r') as f:
            content = f.read()
    return content

def process(name, backup_name):
    if len(name) > 100:
        import pdb
        pdb.set_trace()
    result = session.query(StemFreq).filter(StemFreq.title==name).first()
    if result is None:
        content = get_text(name, backup_name)
        print('processing {}'.format(name))
        words = nltk.word_tokenize(content)
        word_freq = {}
        total = len(words)
        for word in words:
            if word not in word_freq:
                word_freq[word] = 0
            word_freq[word] += 1
        lemma_freq = {}
        for word in word_freq:
            lemma = stemmer.stem(word)
            if lemma not in lemma_freq:
                lemma_freq[lemma] = 0
            lemma_freq[lemma] += word_freq[word]/total
        for lemma in lemma_freq:
            freq = lemma_freq[lemma]
            if len(lemma) < 100:
                session.add(StemFreq(stem=lemma, freq=freq, title=name))
        session.commit()

def build():
    fn = 'outline.txt'
    items = []
    with open(fn, 'r') as f:
        for line in f:
            line = line.strip()
            heading_pattern = '=+\s*(.*?)\s*=+.*'
            item_pattern = '\*+\s*\[\[(.*?\|)?(.*?)\]\].*'
            heading_prog = re.compile(heading_pattern)
            item_prog = re.compile(item_pattern)
            match_heading = heading_prog.match(line)
            match_item = item_prog.match(line)
            if match_heading:
                heading = match_heading.groups()[0]
            elif match_item:
                item = match_item.groups()[1]
                backup_name = match_item.groups()[0]
                if backup_name:
                    backup_name = backup_name[:-1]
                items.append((item, backup_name))
    for item in items:
        process(item[0], item[1])

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        build()
    else:
        match_text(' '.join(args))
