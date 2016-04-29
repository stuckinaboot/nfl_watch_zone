from sys import argv
import random
refFile = open('ref_file.json')
numOutputFiles = int(argv[1])

line = refFile.readlines()[0]
for i in range(0, numOutputFiles):
	strToWrite = line
	while (strToWrite.find('replace_me') != -1):
		strToWrite = strToWrite.replace('replace_me', str(int(random.random() * 50)), 1)
	outputFile = open('games/' + str(i + 1) + '.json', 'w')
	outputFile.write(strToWrite)
	outputFile.close()
	print i