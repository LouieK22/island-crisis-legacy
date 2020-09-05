const Timer = (name: string) => {
	const t1 = os.clock();

	return () => {
		print(`${name} took ${(os.clock() - t1) * 1000}ms`);
	};
};

export = Timer;
