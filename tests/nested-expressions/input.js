const div = (
    <div>
        {Array(10).fill(null).map((e, i) => (
            <div>{i % 2 === 0 ? <span className="even">{i}</span> : <span>{i}</span>}</div>))}
    </div>
);