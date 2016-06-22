import os
import sys

# Put communityshare in sys
this_directory = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.abspath(os.path.join(this_directory, '..')))

from community_share import config, store, Base
from community_share.models.user import User, TypedLabel
from community_share.models.search import Label

grade_level_labels = set((
    'K-5', '6-8', '9-12', 'College', 'Adult',
    'K-3', '4-5', '6-8', '9-12', 'Preschool',
))
engagement_labels = set((
    'Guest Speaker', 'Host Field Trip', 'Judge Student Competition',
    'Participate in Career Day', 'Collaborate on a Class Project',
    'Mentor Students', 'Brainstorm Curriculum Ideas with Educator',
    'Hands-On Demonstration',
    'Guest', 'Speaker', 'Field Trip Host', 'Student Competition Judge',
    'Individual/Group Mentor', 'Share Curriculum Ideas', 'Curriculuum Development',
    'Career Day Participant', 'Collaborator on a Class Project',
    'Long-term', 'Individual Mentor', 'Short-term',
    'Small Group Mentor', 'Classroom Materials Provider',
    'Student Competition Judget',
))

if __name__ == '__main__':
    config.load_from_file()
    Base.metadata.create_all(store.engine)
    users = store.session.query(User).all()
    # Update the is_community_partner and is_educator in the user table.
    for user in users:
        is_educator = False
        search = user.educator_profile_search
        if (search and search.active):
            is_educator = (len(search.labels) > 0)
        is_community_partner = False
        search = user.community_partner_profile_search
        if (search and search.active):
            is_community_partner = (len(search.labels) > 0)
        user.is_community_partner = is_community_partner
        user.is_educator = is_educator
        store.session.add(user)
    store.session.commit()
    # Update Labels
    labels = store.session.query(Label).all()
    for label in labels:
        if label.active:
            if label.name in grade_level_labels:
                typ='gradelevel'
            elif label.name in engagement_labels:
                typ='engagement'
            else:
                typ='expertise'
            check = store.session.query(TypedLabel).filter(TypedLabel.name==label.name, TypedLabel.typ==typ).first()
            if not check:
                new_label = TypedLabel(
                    name=label.name,
                    typ=typ,
                )
                store.session.add(new_label)
    store.session.commit()
    # Associate Labels with Users instead of with searches.
    for user in users:
        cp_search = user.community_partner_profile_search
        if cp_search:
            for label in cp_search.labels:
                typed_label = store.session.query(TypedLabel).filter(TypedLabel.name==label.name).first()
                user.labels.append(typed_label)
        ed_search = user.educator_profile_search
        if ed_search:
            for label in ed_search.labels:
                typed_label = store.session.query(TypedLabel).filter(TypedLabel.name==label.name).first()
                if typed_label.typ == 'gradelevel':
                    user.labels.append(typed_label)
    store.session.commit()
    # Make a search string for the Community partners.
    for user in users:
        user.update_search_text()
        store.session.add(user)
    store.session.commit()
