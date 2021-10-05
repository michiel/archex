#!/bin/bash

STAMP=`date +%F-%H%M`
TEMPDIR=`mktemp -d`
CURRDIR=`pwd`
OUTDIR=$CURRDIR/out
PROJECT=project-dosa
PROJECT_DIR=$TEMPDIR/$PROJECT

mkdir $OUTDIR
cp -r demos $PROJECT_DIR
cp dist/main.js $PROJECT_DIR
cd $TEMPDIR
for file in `ls $PROJECT/*html`;
do
  echo $file
  sed -i 's/..\/dist\///' $file
done
zip -r $OUTDIR/$PROJECT-$STAMP.zip $PROJECT
cd $CURRDIR





