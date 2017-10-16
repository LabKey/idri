#
# Copyright (c) 2015-2017 LabKey Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
"""
Setup script for Python client API for LabKey Server.

Also installs included versions of third party libraries, if those libraries
are not already installed.
"""
import re
from setuptools import setup

packages = [
    'watch'
]

with open('watch/__init__.py', 'r') as fd:
    version = re.search(r'^__version__\s*=\s*[\'"]([^\'"]*)[\'"]',
                        fd.read(), re.MULTILINE).group(1)

if not version:
    raise RuntimeError('Cannot find version information')

setup(
    name='watch',
    version=version,
    description='HPLC upload tool',
    long_description='HPLC upload tool',
    license="Apache License 2.0",
    author='LabKey',
    author_email='nicka@labkey.com',
    maintainer='Nick Kerr',
    maintainer_email='nicka@labkey.com',
    url='https://github.com/LabKey/idri',
    packages=packages,
    package_data={},
    install_requires=['requests'],
    tests_require=['requests', 'watchdog'],
    keywords="labkey hplc",
    classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: Console',
        'Intended Audience :: Science/Research',
        'Intended Audience :: System Administrators',
        'License :: OSI Approved :: Apache Software License',
        'Operating System :: MacOS',
        'Operating System :: Microsoft',
        'Operating System :: POSIX',
        'Programming Language :: Python :: 2',
        'Topic :: Scientific/Engineering'
    ]
)
