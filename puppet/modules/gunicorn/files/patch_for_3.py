import os

import gunicorn

if __name__ == '__main__':
    version = gunicorn.__version__
    fns = (
        os.path.join('usr', 'bin', 'gunicorn'),
        os.path.join('usr', 'sbin', 'gunicorn-debian'),
    )
    # Replace shebangs
    '#! /usr/bin/python'
    '#! /usr/bin/python3'
    
           
