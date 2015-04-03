import community_share
import nltk
from nltk.corpus import wordnet
from community_share.models.user import User

from exploratory import process_outline
# Links
# http://www.industrybuildingblocks.com/Industry-Groups.php
# http://en.wikipedia.org/wiki/Outline_of_academic_disciplines
# http://en.wikipedia.org/wiki/List_of_professions
# http://jobs.lovetoknow.com/List_of_Different_Careers

if __name__ == '__main__':
    subjects = set(wordnet.synset('subject.n.03').closure(lambda s:s.hyponyms()))
    ignored_subjects = set([
        wordnet.synset('method_acting.n.01'),
        wordnet.synset('character.n.04'),
        wordnet.synset('strategy.n.02')
    ])
    occupations = set(wordnet.synset('occupation.n.01').closure(lambda s:s.hyponyms()))
    ignored_occupations = set([
        wordnet.synset('metier.n.02'),
        wordnet.synset('employment.n.02'),
        wordnet.synset('career.n.01'),
        wordnet.synset('engagement.n.05'),
        wordnet.synset('president_of_the_united_states.n.02'),
        wordnet.synset('service.n.05'),
        wordnet.synset('position.n.06'),
        wordnet.synset('talk.n.03'),
    ])
    ignored_words = set([
        'playing',
        'Mt',
    ])
    subjects -= ignored_subjects
    occupations -= ignored_occupations
    community_share.config.load_from_environment()
    s = community_share.store.session()
    users = s.query(User)
    total_with_bio = 0
    total_with_subject = 0
    total_with_occupation = 0
    total_with_any = 0
    for user in users.all():
        n_labels = 0
        if user.community_partner_profile_search:
            n_labels = len(user.community_partner_profile_search.labels)
        if user.bio is not None and n_labels > 0:
            tokens = nltk.word_tokenize(user.bio)
            tagged = nltk.pos_tag(tokens)
            nouns = set([w for w, t in tagged if t[0] == 'N'])
            nouns -= ignored_words
            has_subject = False
            has_occupation = False
            has_any = False
            for n in nouns:
                these_synsets = wordnet.synsets(n)
                best_match = None
                best_sim = 0
                these_subjects = []
                these_occupations = []
                for s1 in these_synsets:
                    if s1 in subjects:
                        these_subjects.append(s1)
                    if s1 in occupations:
                        these_occupations.append(s1)    
                if these_subjects or these_occupations:
                    print(n, these_subjects, these_occupations)
                    has_any = True
                if these_subjects:
                    has_subject = True
                if these_occupations:
                    has_occupation = True
            total_with_bio += 1
            if has_subject:
                total_with_subject += 1
            if has_occupation:
                total_with_occupation += 1
            if has_any:
                total_with_any += 1
            subs = process_outline.match_text(user.bio)
            import pdb
            pdb.set_trace()
        
    print(total_with_bio, total_with_subject, total_with_occupation, total_with_any)

        
    
    
    
